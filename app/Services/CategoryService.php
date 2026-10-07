<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Category;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CategoryService
{
    public function getAllCategories()
    {
        return Category::withCount('products')->orderBy('name')->get();
    }

    public function createCategory(array $data)
    {
        $category = DB::transaction(function () use ($data) {
            $subCategories = $data['sub_categories'] ?? null;
            unset($data['sub_categories']);

            $category = Category::create($data);

            if (is_array($subCategories)) {
                foreach ($subCategories as $sub) {
                    $subName = trim($sub['name'] ?? '');
                    if ($subName === '') {
                        continue;
                    }
                    Category::create([
                        'name' => $subName,
                        'parent_id' => $category->id,
                        'catalog_group' => $category->catalog_group,
                    ]);
                }
            }

            return $category->fresh(['children']);
        });
        CacheService::flushMotorcycleParts();

        return $category;
    }

    public function getCategoryById($id)
    {
        return Category::find($id);
    }

    public function updateCategory($id, array $data)
    {
        $category = DB::transaction(function () use ($id, $data) {
            $category = Category::whereKey($id)->lockForUpdate()->firstOrFail();

            $subCategories = $data['sub_categories'] ?? null;
            unset($data['sub_categories']);

            $category->update($data);
            $category->children()->update(['catalog_group' => $category->catalog_group]);

            if (is_array($subCategories)) {
                $existingChildIds = $category->children()->pluck('id')->toArray();
                $submittedIds = [];

                foreach ($subCategories as $sub) {
                    $subName = trim($sub['name'] ?? '');
                    if ($subName === '') {
                        continue;
                    }

                    $subId = $sub['id'] ?? null;
                    if ($subId && in_array($subId, $existingChildIds)) {
                        $submittedIds[] = $subId;
                        Category::where('id', $subId)->update([
                            'name' => $subName,
                            'parent_id' => $category->id,
                            'catalog_group' => $category->catalog_group,
                        ]);
                    } else {
                        $newSub = Category::create([
                            'name' => $subName,
                            'parent_id' => $category->id,
                            'catalog_group' => $category->catalog_group,
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
                            throw ValidationException::withMessages([
                                'sub_categories' => "Sub-kategori '{$child->name}' tidak bisa dihapus karena masih memiliki produk.",
                            ]);
                        }
                        $child->delete();
                    }
                }
            }

            return $category->fresh(['children']);
        });
        CacheService::flushMotorcycleParts();

        return $category;
    }

    public function deleteCategory($id)
    {
        $category = Category::findOrFail($id);

        if ($category->products()->exists() || $category->children()->exists()) {
            throw ValidationException::withMessages(['category' => 'Kategori masih memiliki produk atau subkategori. Pindahkan atau hapus isinya terlebih dahulu.']);
        }

        $deleted = $category->delete();
        CacheService::flushMotorcycleParts();

        return $deleted;
    }
}
