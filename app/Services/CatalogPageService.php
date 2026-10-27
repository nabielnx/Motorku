<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Product;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

final class CatalogPageService
{
    public const PAGE_SIZE = 60;

    public function query(): Builder
    {
        return Product::query()->where('is_available', true)
            ->select(['id', 'category_id', 'sku', 'barcode', 'brand', 'unit', 'rack_location', 'name', 'description', 'price', 'stock', 'image_path', 'is_available'])
            ->withExists(['motorcycleParts as is_recommended' => fn ($parts) => $parts->where('is_recommended', true)])
            ->with(['category:id,name,parent_id', 'category.parent:id,name', 'motorcycles:id,brand,model,engine_type,year_start,year_end']);
    }

    public function page(array $filters = []): array
    {
        $query = $this->query();
        if (filled($filters['category'] ?? null)) {
            $query->whereHas('category', fn ($category) => $category->where('name', $filters['category'])->orWhereHas('parent', fn ($parent) => $parent->where('name', $filters['category'])));
        }
        if (filled($filters['search'] ?? null)) {
            app(CatalogSearchService::class)->apply($query, $filters['search']);
        }
        $page = $query->orderBy('name')->orderBy('id')->paginate(self::PAGE_SIZE, ['*'], 'page', (int) ($filters['page'] ?? 1));

        return ['products' => $this->serializeProducts($page->getCollection()), 'pagination' => [
            'page' => $page->currentPage(), 'next_page' => $page->hasMorePages() ? $page->currentPage() + 1 : null,
            'total' => $page->total(), 'last_page' => $page->lastPage(),
        ]];
    }

    public function cart(array $ids): array
    {
        return $ids ? $this->serializeProducts($this->query()->whereIn('id', $ids)->get()) : [];
    }

    public function salesData(): Collection
    {
        return Cache::remember(CacheService::key('catalog:sales:v1'), 60, fn () => app(BusinessContext::class)->table('order_items')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->where('orders.order_status', '!=', 'cancelled')
            ->whereExists(fn ($query) => $query->selectRaw('1')->from('payments')->whereColumn('payments.order_id', 'orders.id')->where('payments.status', 'paid'))
            ->select('order_items.product_id', DB::raw('SUM(order_items.quantity) as total_sold'))
            ->groupBy('order_items.product_id')->orderByDesc('total_sold')->get());
    }

    private function serializeProducts(Collection $products): array
    {
        $sales = $this->salesData()->pluck('total_sold', 'product_id');

        return $products->map(fn ($product) => [...$this->serialize($product), 'total_sold' => (int) ($sales[$product->id] ?? 0), 'is_recommended' => (bool) $product->is_recommended])->all();
    }

    private function serialize(Product $product): array
    {
        // Avoid serializing full pivot models/unused attributes for every fitment.
        return [...$product->getAttributes(), 'stock' => (int) $product->stock, 'is_available' => (bool) $product->is_available,
            'image_preview_path' => app(ImagePreviewService::class)->existing($product->image_path),
            'category' => $product->category ? [...$product->category->getAttributes(), 'parent' => $product->category->parent?->getAttributes()] : null,
            'motorcycles' => $product->motorcycles->map(fn ($motorcycle) => $motorcycle->getAttributes())->all(),
        ];
    }
}
