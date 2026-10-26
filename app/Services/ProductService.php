<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Product;
use App\Models\User;
use App\Support\BusinessFiles;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;

class ProductService
{
    public const MAX_BULK_DELETE = 5000;

    public function getProductsForWeb(?string $search = null, ?string $category = null, ?string $stockStatus = null, ?string $availability = null, ?string $sort = null, ?string $group = null, int $perPage = 16)
    {
        return $this->queryProductsForWeb($search, $category, $stockStatus, $availability, $sort, $group)
            ->paginate(in_array($perPage, [14, 16, 18, 20, 24], true) ? $perPage : 16)->withQueryString();
    }

    private function queryProductsForWeb(?string $search = null, ?string $category = null, ?string $stockStatus = null, ?string $availability = null, ?string $sort = null, ?string $group = null): Builder
    {
        $query = Product::with('category')->inCatalogGroup($group);

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

        if ($search !== null && trim($search) !== '') {
            app(CatalogSearchService::class)->apply($query, $search, ! in_array($sort, ['name_asc', 'name_desc', 'price_asc', 'price_desc'], true));
        }

        match ($sort) {
            'name_asc' => $query->orderBy('name')->orderBy('id'),
            'name_desc' => $query->orderByDesc('name')->orderBy('id'),
            'price_asc' => $query->orderBy('price')->orderBy('id'),
            'price_desc' => $query->orderByDesc('price')->orderBy('id'),
            default => $query->latest(),
        };

        return $query;
    }

    public function getAllProducts($perPage = null, $search = null, $stockStatus = null)
    {
        $query = Product::with(['category.parent', 'motorcycles']);
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
        if ($search !== null && trim($search) !== '') {
            $this->applyFuzzySearch($query, $search);
        }
        $query->latest();

        return $perPage ? $query->paginate($perPage) : $query->get();
    }

    public function createProduct(array $data)
    {
        if (! isset($data['image'])) {
            return Product::create($data);
        }
        $file = $data['image'];
        unset($data['image']);

        return app(ImageUploadService::class)->replace($file, 'products', null,
            fn ($path) => Product::create([...$data, 'image_path' => $path]));
    }

    public function getProductById($id)
    {
        return Product::with('category')->find($id);
    }

    public function updateProduct($id, array $data)
    {
        return DB::transaction(fn () => $this->updateLockedProduct($id, $data), 3);
    }

    private function updateLockedProduct($id, array $data)
    {
        $product = Product::whereKey($id)->lockForUpdate()->firstOrFail();
        abort_unless(isset($data['sync_version']) && (int) $data['sync_version'] === (int) $product->sync_version, 409,
            'Produk sudah diubah. Muat ulang data terbaru sebelum menyimpan kembali.');
        $data['sync_version'] = $product->sync_version + 1;
        $removeImage = filter_var($data['remove_image'] ?? false, FILTER_VALIDATE_BOOLEAN);
        unset($data['remove_image']);
        if (isset($data['image'])) {
            $file = $data['image'];
            unset($data['image']);
            $newPath = app(ImageUploadService::class)->store($file, 'products');
            try {
                $oldPath = $product->image_path;
                $product->update([...$data, 'image_path' => $newPath]);
                DB::afterCommit(fn () => $oldPath ? BusinessFiles::delete($oldPath) : null);
            } catch (\Throwable $exception) {
                BusinessFiles::delete($newPath);
                throw $exception;
            }
        } elseif ($removeImage) {
            $oldPath = $product->image_path;
            $product->update([...$data, 'image_path' => null]);

            if ($oldPath && str_starts_with($oldPath, 'products/') && ! str_contains($oldPath, '..')) {
                DB::afterCommit(function () use ($oldPath) {
                    if (! Product::where('image_path', $oldPath)->exists()) {
                        BusinessFiles::delete($oldPath);
                    }
                });
            }
        } else {
            $product->update($data);
        }

        return $product;
    }

    public function deleteProduct($id)
    {
        return DB::transaction(function () use ($id) {
            $product = Product::whereKey($id)->lockForUpdate()->firstOrFail();

            return $this->deleteProductRecord($product);
        });
    }

    public function previewBulkDelete(array $selection, User $actor): array
    {
        abort_unless(app(DeletionControlService::class)->enabled(), 403, DeletionControlService::MESSAGE);
        $products = $this->bulkSelectionQuery($selection)->limit(self::MAX_BULK_DELETE + 1)->get();
        if ($products->isEmpty() || $products->count() > self::MAX_BULK_DELETE) {
            throw ValidationException::withMessages(['selection' => 'Pilih 1 sampai '.self::MAX_BULK_DELETE.' produk untuk dihapus dalam satu proses.']);
        }
        if ($selection['mode'] === 'ids' && $products->count() !== count($selection['ids'])) {
            throw ValidationException::withMessages(['selection' => 'Pilihan produk berubah. Muat ulang daftar dan pilih kembali.']);
        }
        foreach ($products as $product) {
            Gate::forUser($actor)->authorize('delete', $product);
        }

        $payload = [
            'purpose' => 'product-bulk-delete',
            'business_id' => app(BusinessContext::class)->id(),
            'user_id' => $actor->id,
            'selection' => $selection,
            'count' => $products->count(),
            'fingerprint' => $this->selectionFingerprint($products),
            'expires_at' => now()->addMinutes(5)->timestamp,
        ];

        return ['count' => $payload['count'], 'token' => Crypt::encryptString(json_encode($payload, JSON_THROW_ON_ERROR))];
    }

    public function bulkDelete(string $token, User $actor): int
    {
        abort_unless(app(DeletionControlService::class)->enabled(), 403, DeletionControlService::MESSAGE);
        try {
            $payload = json_decode(Crypt::decryptString($token), true, 512, JSON_THROW_ON_ERROR);
        } catch (\Throwable) {
            throw ValidationException::withMessages(['token' => 'Konfirmasi penghapusan tidak valid. Pilih kembali produk.']);
        }
        abort_unless(($payload['purpose'] ?? null) === 'product-bulk-delete'
            && ($payload['business_id'] ?? null) === app(BusinessContext::class)->id()
            && ($payload['user_id'] ?? null) === $actor->id, 403);
        abort_if(($payload['expires_at'] ?? 0) <= now()->timestamp, 409, 'Konfirmasi kedaluwarsa. Periksa kembali pilihan produk.');

        return DB::transaction(function () use ($payload, $actor): int {
            $products = $this->bulkSelectionQuery($payload['selection'])->lockForUpdate()->limit(self::MAX_BULK_DELETE + 1)->get();
            abort_unless($products->count() === $payload['count']
                && hash_equals($payload['fingerprint'], $this->selectionFingerprint($products)), 409,
                'Daftar produk atau stok sudah berubah. Muat ulang dan konfirmasi kembali.');
            foreach ($products as $product) {
                Gate::forUser($actor)->authorize('delete', $product);
            }
            foreach ($products as $product) {
                $this->deleteProductRecord($product);
            }
            DB::afterCommit(fn () => CacheService::flushMotorcycleParts());

            return $products->count();
        }, 3);
    }

    private function bulkSelectionQuery(array $selection): Builder
    {
        if ($selection['mode'] === 'ids') {
            return Product::whereKey($selection['ids'])->orderBy('id');
        }
        $filters = $selection['filters'];

        return $this->queryProductsForWeb(
            $filters['search'] ?? null, $filters['category'] ?? null,
            $filters['stock_status'] ?? null, $filters['availability'] ?? null,
            null, $filters['group'] ?? null,
        )->withOut('category')->reorder()->orderBy('products.id')
            ->whereNotIn('products.id', $selection['excluded_ids'] ?? []);
    }

    private function selectionFingerprint(Collection $products): string
    {
        return hash('sha256', $products->sortBy('id')->map(fn (Product $product) => [$product->id, (int) $product->sync_version])->values()->toJson());
    }

    private function deleteProductRecord(Product $product): bool
    {
        $path = $product->image_path;
        abort_unless($product->delete(), 409, 'Produk tidak dapat dihapus. Muat ulang daftar.');
        if ($path && str_starts_with($path, 'products/') && ! str_contains($path, '..')) {
            DB::afterCommit(function () use ($path) {
                if (! Product::where('image_path', $path)->exists()) {
                    BusinessFiles::delete($path);
                }
            });
        }

        return true;
    }

    protected function applyFuzzySearch($query, string $search): void
    {
        app(CatalogSearchService::class)->apply($query, $search);
    }
}
