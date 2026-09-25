<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Category;
use Illuminate\Support\Facades\Storage;

class CategoryService
{
    public function getAllCategories()
    {
        return Category::withCount('products')->orderBy('name')->get();
    }

    public function createCategory(array $data)
    {
        $subCategories = $data['sub_categories'] ?? null;
        unset($data['sub_categories']);

        $category = Category::create($data);

        if (is_array($subCategories)) {
            foreach ($subCategories as $sub) {
                $subName = trim($sub['name'] ?? '');
                if ($subName === '') continue;
                Category::create([
                    'name' => $subName,
                    'parent_id' => $category->id,
                ]);
            }
        }

        return $category->fresh(['children']);
    }

    public function getCategoryById($id)
    {
        return Category::find($id);
    }

    public function updateCategory($id, array $data)
    {
        $category = Category::findOrFail($id);

        $subCategories = $data['sub_categories'] ?? null;
        unset($data['sub_categories']);

        $category->update($data);

        if (is_array($subCategories)) {
            $existingChildIds = $category->children()->pluck('id')->toArray();
            $submittedIds = [];

            foreach ($subCategories as $sub) {
                $subName = trim($sub['name'] ?? '');
                if ($subName === '') continue;

                $subId = $sub['id'] ?? null;
                if ($subId && in_array($subId, $existingChildIds)) {
                    $submittedIds[] = $subId;
                    Category::where('id', $subId)->update([
                        'name' => $subName,
                        'parent_id' => $category->id,
                    ]);
                } else {
                    $newSub = Category::create([
                        'name' => $subName,
                        'parent_id' => $category->id,
                    ]);
                    $submittedIds[] = $newSub->id;
                }
            }

            // Remove subcategories removed from the list
            $toDeleteIds = array_diff($existingChildIds, $submittedIds);
            foreach ($toDeleteIds as $delId) {
                $child = Category::find($delId);
                if ($child) {
                    if ($child->products()->count() > 0) {
                        throw new \Exception("Sub-kategori '{$child->name}' tidak bisa dihapus karena masih memiliki {$child->products()->count()} produk.");
                    }
                    $child->delete();
                }
            }
        }

        return $category->fresh(['children']);
    }

    public function deleteCategory($id)
    {
        $category = Category::findOrFail($id);

        if ($category->products()->count() > 0) {
            throw new \Exception('Tidak bisa menghapus kategori karena masih memiliki produk.');
        }

        return $category->delete();
    }
}