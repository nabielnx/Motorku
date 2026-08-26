<?php

namespace App\Services;

use App\Models\Product;
use Illuminate\Support\Facades\Storage;

class ProductService
{
    public function getAllProducts($perPage = null, $search = null, $stockStatus = null) {
        $query = Product::with('category');
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('sku', 'like', "%{$search}%");
            });
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

    public function createProduct(array $data) {
        if (isset($data['image'])) {
            $data['image_path'] = $data['image']->store('products', 'public');
            unset($data['image']);
        }
        return Product::create($data);
    }

    public function getProductById($id) {
        return Product::with('category')->find($id);
    }

    public function updateProduct($id, array $data) {
        $product = Product::findOrFail($id);
        if (isset($data['image'])) {
            if ($product->image_path) {
                Storage::disk('public')->delete($product->image_path);
            }
            $data['image_path'] = $data['image']->store('products', 'public');
            unset($data['image']);
        }
        if (isset($product->sync_version)) $data['sync_version'] = $product->sync_version + 1;
        $product->update($data);
        return $product;
    }

    public function deleteProduct($id) {
        $product = Product::findOrFail($id);
        if ($product->image_path) {
            Storage::disk('public')->delete($product->image_path);
        }
        return $product->delete();
    }
}
