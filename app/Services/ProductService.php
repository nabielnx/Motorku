<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Product;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Intervention\Image\ImageManager;
use RuntimeException;

class ProductService
{
    public function getProductsForWeb(?string $search = null, ?string $category = null, ?string $stockStatus = null, ?string $availability = null, ?string $sort = null)
    {
        $query = Product::with('category');

        if ($search) {
            $this->applyFuzzySearch($query, $search);
        }

        if ($category && $category !== 'All') {
            $query->whereHas('category', function ($q) use ($category) {
                $q->where('name', $category)
                    ->orWhereHas('parent', fn ($parent) => $parent->where('name', $category));
            });
        }

        if ($stockStatus && $stockStatus !== 'all') {
            if ($stockStatus === 'low') {
                $query->where('stock', '>', 0)->whereColumn('stock', '<=', 'minimum_stock');
            } elseif ($stockStatus === 'out') {
                $query->where('stock', '<=', 0);
            } elseif ($stockStatus === 'normal') {
                $query->whereColumn('stock', '>', 'minimum_stock');
            }
        }

        if ($availability === 'active' || $availability === 'inactive') {
            $query->where('is_available', $availability === 'active');
        }

        match ($sort) {
            'name_asc' => $query->orderBy('name')->orderBy('id'),
            'name_desc' => $query->orderByDesc('name')->orderBy('id'),
            'price_asc' => $query->orderBy('price')->orderBy('id'),
            'price_desc' => $query->orderByDesc('price')->orderBy('id'),
            default => $query->latest(),
        };

        return $query->paginate(16)->withQueryString();
    }

    public function getAllProducts($perPage = null, $search = null, $stockStatus = null)
    {
        $query = Product::with('category');
        if ($search) {
            $this->applyFuzzySearch($query, $search);
        }
        if ($stockStatus) {
            switch ($stockStatus) {
                case 'low':
                    $query->whereColumn('stock', '<=', 'minimum_stock');
                    break;
                case 'normal':
                    $query->whereColumn('stock', '>', 'minimum_stock');
                    break;
            }
        }
        $query->latest();

        return $perPage ? $query->paginate($perPage) : $query->get();
    }

    public function createProduct(array $data)
    {
        if (isset($data['image'])) {
            $data['image_path'] = $this->storeProductImage($data['image']);
            unset($data['image']);
        }

        return Product::create($data);
    }

    public function getProductById($id)
    {
        return Product::with('category')->find($id);
    }

    public function updateProduct($id, array $data)
    {
        $product = Product::findOrFail($id);
        $oldImagePath = null;

        if (isset($data['image'])) {
            $oldImagePath = $product->image_path;
            $data['image_path'] = $this->storeProductImage($data['image']);
            unset($data['image']);
        }
        if (isset($product->sync_version)) {
            $data['sync_version'] = $product->sync_version + 1;
        }
        $product->update($data);

        if ($oldImagePath && Storage::disk('public')->exists($oldImagePath)) {
            Storage::disk('public')->delete($oldImagePath);
        }

        return $product;
    }

    private function storeProductImage(UploadedFile $file): string
    {
        $path = 'products/'.Str::uuid().'.webp';
        $image = ImageManager::gd()->read($file->getRealPath())->toWebp(quality: 82, strip: true);

        if (! Storage::disk('public')->put($path, (string) $image)) {
            throw new RuntimeException('Gagal menyimpan gambar produk.');
        }

        return $path;
    }

    public function deleteProduct($id)
    {
        $product = Product::findOrFail($id);

        return $product->delete();
    }

    /**
     * Apply smart fuzzy & space-tolerant search to product query.
     */
    protected function applyFuzzySearch($query, string $search): void
    {
        $search = trim($search);
        if ($search === '') {
            return;
        }

        $cleanSearch = preg_replace('/[^a-zA-Z0-9]/', '', $search);
        $tokens = array_filter(explode(' ', $search));

        $query->where(function ($q) use ($search, $cleanSearch, $tokens) {
            // 1. Exact substring
            $q->where('name', 'like', "%{$search}%")
                ->orWhere('sku', 'like', "%{$search}%");

            // 2. Alphanumeric normalized match (e.g. 'mpx2' matches 'MPX 2', 'vbelt' matches 'V-Belt')
            if (strlen($cleanSearch) >= 2) {
                $q->orWhereRaw("REPLACE(REPLACE(REPLACE(REPLACE(name, ' ', ''), '-', ''), '.', ''), '/', '') LIKE ?", ["%{$cleanSearch}%"])
                    ->orWhereRaw("REPLACE(REPLACE(REPLACE(REPLACE(sku, ' ', ''), '-', ''), '.', ''), '/', '') LIKE ?", ["%{$cleanSearch}%"]);
            }

            // 3. Multi-token matching if query contains multiple words
            if (count($tokens) > 1) {
                $q->orWhere(function ($subQ) use ($tokens) {
                    foreach ($tokens as $token) {
                        $tokenClean = preg_replace('/[^a-zA-Z0-9]/', '', $token);
                        $subQ->where(function ($tQ) use ($token, $tokenClean) {
                            $tQ->where('name', 'like', "%{$token}%")
                                ->orWhere('sku', 'like', "%{$token}%");
                            if (strlen($tokenClean) >= 2) {
                                $tQ->orWhereRaw("REPLACE(REPLACE(REPLACE(REPLACE(name, ' ', ''), '-', ''), '.', ''), '/', '') LIKE ?", ["%{$tokenClean}%"]);
                            }
                        });
                    }
                });
            }
        });
    }
}
