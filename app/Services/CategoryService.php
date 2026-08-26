<?php

namespace App\Services;

use App\Models\Category;

class CategoryService
{
    public function getAllCategories() {
        return Category::all();
    }

    public function createCategory(array $data) {
        return Category::create($data);
    }

    public function getCategoryById($id) {
        return Category::find($id);
    }

    public function updateCategory($id, array $data) {
        $category = Category::findOrFail($id);
        if (isset($category->sync_version)) $data['sync_version'] = $category->sync_version + 1;
        $category->update($data);
        return $category;
    }

    public function deleteCategory($id) {
        $category = Category::withCount('products')->findOrFail($id);
        if ($category->products_count > 0) {
            throw new \Exception("Kategori '{$category->name}' tidak dapat dihapus karena masih memiliki {$category->products_count} produk.");
        }
        return $category->delete();
    }
}