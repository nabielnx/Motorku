<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Category;
use App\Services\Migrations\ReconcileImportedBrakeCategories20261012;
use Illuminate\Support\Collection;

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
        return app(ReconcileImportedBrakeCategories20261012::class)->run();
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
