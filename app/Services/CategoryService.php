<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Category;
use App\Models\DataType;
use App\Models\Product;
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
            DataType::where('kind', 'product')->where('key', $data['catalog_group'] ?? 'automotive')->lockForUpdate()->firstOrFail();
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
            DataType::where('kind', 'product')->where('key', $data['catalog_group'] ?? $category->catalog_group)->lockForUpdate()->firstOrFail();

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
                if ($toDeleteIds !== [] && ! app(DeletionControlService::class)->enabled()) {
                    throw ValidationException::withMessages(['sub_categories' => DeletionControlService::MESSAGE]);
                }
                foreach ($toDeleteIds as $delId) {
                    $child = Category::find($delId);
                    if ($child) {
                        $this->deleteCategory($child->id);
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
        return DB::transaction(function () use ($id) {
            $category = Category::whereKey($id)->lockForUpdate()->firstOrFail();
            $deleted = $this->deleteContents($category);
            DB::afterCommit(fn () => CacheService::flushMotorcycleParts());

            return $deleted;
        }, 3);
    }

    private function deleteContents(Category $category): bool
    {
        foreach ($category->children()->orderBy('id')->lockForUpdate()->get() as $child) {
            $this->deleteContents($child);
        }
        Product::where('category_id', $category->id)->eachById(fn ($product) => app(ProductService::class)->deleteProduct($product->id), 100);

        return (bool) $category->delete();
    }
}
