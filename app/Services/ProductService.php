<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Product;
use App\Support\BusinessFiles;
use Illuminate\Support\Facades\DB;

class ProductService
{
    public function getProductsForWeb(?string $search = null, ?string $category = null, ?string $stockStatus = null, ?string $availability = null, ?string $sort = null, ?string $group = null, int $perPage = 16)
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

        return $query->paginate(in_array($perPage, [14, 16, 18, 20, 24], true) ? $perPage : 16)->withQueryString();
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
            $path = $product->image_path;
            $deleted = $product->delete();
            if ($path && str_starts_with($path, 'products/') && ! str_contains($path, '..')) {
                DB::afterCommit(function () use ($path) {
                    if (! Product::where('image_path', $path)->exists()) {
                        BusinessFiles::delete($path);
                    }
                });
            }

            return $deleted;
        });
    }

    protected function applyFuzzySearch($query, string $search): void
    {
        app(CatalogSearchService::class)->apply($query, $search);
    }
}
