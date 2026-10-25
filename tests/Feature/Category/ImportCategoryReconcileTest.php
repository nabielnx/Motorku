<?php

declare(strict_types=1);

namespace Tests\Feature\Category;

use App\Models\Category;
use App\Models\Product;
use App\Services\ProductImportCategoryService;
use Database\Seeders\CategorySeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ImportCategoryReconcileTest extends TestCase
{
    use RefreshDatabase;

    public function test_migration_moves_imported_products_and_removes_empty_duplicate_roots(): void
    {
        $this->seed(CategorySeeder::class);
        $mapping = [
            'Kampas Rem Cakram' => 'Kampas Rem Cakram (Brake Pad)',
            'Kampas Rem Tromol' => 'Kampas Rem Tromol (Brake Shoe)',
            'Piringan Cakram' => 'Piringan Cakram (Disc)',
            'Master Rem' => 'Master Rem & Kaliper (Kit Seal)',
        ];
        $records = [];
        foreach ($mapping as $source => $target) {
            $category = Category::create(['name' => $source, 'catalog_group' => 'automotive']);
            $product = Product::factory()->create(['category_id' => $category->id, 'sku' => 'IMP-'.count($records), 'stock' => 17, 'price' => 52000, 'cost_price' => 34000, 'unit' => 'set', 'is_available' => false, 'image_path' => 'products/rem.webp']);
            $records[] = ['product' => $product, 'target' => $target, 'original' => $product->fresh()->getRawOriginal()];
        }
        $migration = require database_path('migrations/2026_10_12_000002_reconcile_imported_brake_categories.php');
        $migration->up();
        foreach ($records as $record) {
            $product = $record['product']->fresh();
            $this->assertSame(Category::where('name', $record['target'])->value('id'), $product->category_id);
            foreach (['id', 'sku', 'name', 'stock', 'price', 'cost_price', 'unit', 'is_available', 'image_path', 'created_at'] as $field) {
                $this->assertSame($record['original'][$field], $product->getRawOriginal($field), $field);
            }
            $this->assertSame((int) $record['original']['sync_version'] + 1, $product->sync_version);
        }
        foreach (array_keys($mapping) as $source) {
            $this->assertDatabaseMissing('categories', ['name' => $source, 'catalog_group' => 'automotive', 'parent_id' => null]);
        }
        $migration->up();
        foreach ($records as $record) {
            $this->assertSame((int) $record['original']['sync_version'] + 1, $record['product']->fresh()->sync_version);
        }
        $migration->down();
        $this->assertSame(4, Product::count());
    }

    public function test_cleanup_leaves_custom_products_other_groups_and_parent_categories_intact(): void
    {
        $this->seed(CategorySeeder::class);
        $manual = Category::create(['name' => 'Kampas Rem Cakram', 'catalog_group' => 'automotive']);
        $manualProduct = Product::factory()->create(['category_id' => $manual->id, 'sku' => 'OEM-001']);
        $bicycle = Category::create(['name' => 'Master Rem', 'catalog_group' => 'bicycle']);
        $bicycleProduct = Product::factory()->create(['category_id' => $bicycle->id, 'sku' => 'IMP-BICYCLE']);
        $parent = Category::create(['name' => 'Piringan Cakram', 'catalog_group' => 'automotive']);
        Category::create(['name' => 'Cakram Custom', 'catalog_group' => 'automotive', 'parent_id' => $parent->id]);
        $parentProduct = Product::factory()->create(['category_id' => $parent->id, 'sku' => 'IMP-PARENT']);
        $this->assertSame(['products_moved' => 0, 'categories_removed' => 0], app(ProductImportCategoryService::class)->repairImportedBrakeCategories());
        $this->assertSame($manual->id, $manualProduct->fresh()->category_id);
        $this->assertSame($bicycle->id, $bicycleProduct->fresh()->category_id);
        $this->assertSame($parent->id, $parentProduct->fresh()->category_id);
    }

    public function test_cleanup_skips_a_missing_canonical_target(): void
    {
        $source = Category::create(['name' => 'Kampas Rem Cakram', 'catalog_group' => 'automotive']);
        $product = Product::factory()->create(['category_id' => $source->id, 'sku' => 'IMP-ONLY']);
        $this->assertSame(['products_moved' => 0, 'categories_removed' => 0], app(ProductImportCategoryService::class)->repairImportedBrakeCategories());
        $this->assertSame($source->id, $product->fresh()->category_id);
    }
}
