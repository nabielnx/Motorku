<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Category;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class ProductImportCategoryService
{
    private const BRAKE_ALIASES = [
        'Kampas Rem Cakram' => 'Kampas Rem Cakram (Brake Pad)',
        'Kampas Rem Tromol' => 'Kampas Rem Tromol (Brake Shoe)',
        'Piringan Cakram' => 'Piringan Cakram (Disc)',
        'Master Rem' => 'Master Rem & Kaliper (Kit Seal)',
    ];

    public function matches(string $name, string $group, Collection $categories): Collection
    {
        $eligible = $categories->filter(fn ($category) => ($category->parent?->catalog_group ?? $category->catalog_group) === $group);
        if ($group === 'automotive') {
            foreach (self::BRAKE_ALIASES as $alias => $canonical) {
                if ($this->key($name) !== $this->key($alias)) {
                    continue;
                }
                $targets = $eligible->filter(fn ($category) => $category->parent
                    && $this->key($category->parent->name) === $this->key('Pengereman')
                    && $this->key($category->name) === $this->key($canonical));
                // Prefer the existing hierarchy even if an earlier import created
                // an exact-name root category. Multiple targets remain an error.
                if ($targets->isNotEmpty()) {
                    return $targets;
                }
            }
        }

        return $eligible->filter(fn ($category) => $this->key($category->name) === $this->key($name));
    }

    public function repairImportedBrakeCategories(): array
    {
        $result = DB::transaction(function () {
            $counts = ['products_moved' => 0, 'categories_removed' => 0];
            $parents = DB::table('categories')->where('name', 'Pengereman')->where('catalog_group', 'automotive')->whereNull('parent_id')->lockForUpdate()->get();
            if ($parents->count() !== 1) {
                return $counts;
            }
            foreach (self::BRAKE_ALIASES as $alias => $canonical) {
                $targets = DB::table('categories')->where('name', $canonical)->where('parent_id', $parents->first()->id)->where('catalog_group', 'automotive')->lockForUpdate()->get();
                if ($targets->count() !== 1) {
                    continue;
                }
                $sources = DB::table('categories')->where('name', $alias)->whereNull('parent_id')->where('catalog_group', 'automotive')->lockForUpdate()->get();
                foreach ($sources as $source) {
                    // Restrict cleanup to generated import products and leaf roots.
                    // Categories with custom/manual products or children stay intact.
                    if (DB::table('categories')->where('parent_id', $source->id)->exists()
                        || DB::table('products')->where('category_id', $source->id)->where('sku', 'not like', 'IMP-%')->exists()) {
                        continue;
                    }
                    $counts['products_moved'] += DB::table('products')->where('category_id', $source->id)->where('sku', 'like', 'IMP-%')->update([
                        'category_id' => $targets->first()->id,
                        'sync_version' => DB::raw('sync_version + 1'),
                        'updated_at' => now(),
                    ]);
                    if (! DB::table('products')->where('category_id', $source->id)->exists()) {
                        $counts['categories_removed'] += DB::table('categories')->where('id', $source->id)->delete();
                    }
                }
            }

            return $counts;
        });
        if ($result['products_moved'] > 0 || $result['categories_removed'] > 0) {
            CacheService::flushMotorcycleParts();
        }

        return $result;
    }

    public function displayName(Category $category): string
    {
        return $category->parent ? $category->parent->name.' / '.$category->name : $category->name;
    }

    private function key(string $text): string
    {
        return trim(preg_replace('/[^\pL\pN]+/u', ' ', mb_strtolower($text)));
    }
}
