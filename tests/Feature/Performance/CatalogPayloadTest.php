<?php

declare(strict_types=1);

namespace Tests\Feature\Performance;

use App\Models\Motorcycle;
use App\Models\MotorcyclePart;
use App\Models\Product;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class CatalogPayloadTest extends TestCase
{
    use RefreshDatabase;

    public function test_catalog_and_pos_keep_fitment_but_omit_unused_mapping_metadata_and_keep_stock_fresh(): void
    {
        $product = Product::factory()->create(['stock' => 8, 'price' => 50000, 'is_available' => true]);
        $motor = Motorcycle::create(['brand' => 'Honda', 'model' => 'Benchmark', 'slug' => 'benchmark-2025', 'year_start' => 2025, 'engine_cc' => 110]);
        MotorcyclePart::create(['motorcycle_id' => $motor->id, 'product_id' => $product->id, 'part_category' => 'oli', 'notes' => 'Mapping metadata', 'is_recommended' => true]);
        $assertProduct = fn ($page) => $page
            ->where('initialProducts.0.id', $product->id)->where('initialProducts.0.price', '50000.00')->where('initialProducts.0.stock', 8)
            ->where('initialProducts.0.motorcycles.0.id', $motor->id)->where('initialProducts.0.motorcycles.0.model', 'Benchmark')
            ->missing('initialProducts.0.motorcycles.0.pivot')->missing('initialProducts.0.cost_price');
        $this->get('/')->assertOk()->assertInertia($assertProduct);
        $this->seed(RoleSeeder::class);
        $owner = User::factory()->create();
        $owner->assignRole('owner');
        $this->actingAs($owner)->get('/pos')->assertOk()->assertInertia($assertProduct);
        $product->update(['price' => 60000, 'stock' => 3]);
        foreach (['/', '/pos'] as $url) {
            $this->get($url)->assertOk()->assertInertia(fn ($page) => $page
                ->where('initialProducts.0.price', '60000.00')->where('initialProducts.0.stock', 3));
        }
    }

    public function test_partial_product_refresh_skips_category_counts_and_stock_summary_queries(): void
    {
        $this->seed(RoleSeeder::class);
        $owner = User::factory()->create();
        $owner->assignRole('owner');
        $product = Product::factory()->create(['stock' => 1, 'minimum_stock' => 5]);
        $full = $this->actingAs($owner)->get('/products')->assertOk();
        $version = $full->viewData('page')['version'];
        DB::enableQueryLog();
        DB::flushQueryLog();
        try {
            $this->get('/products', [
                'X-Inertia' => 'true', 'X-Inertia-Version' => $version,
                'X-Inertia-Partial-Component' => 'Product/Index', 'X-Inertia-Partial-Data' => 'initialProducts',
            ])->assertOk()->assertJsonPath('props.initialProducts.data.0.id', $product->id)
                ->assertJsonMissingPath('props.initialCategories')->assertJsonMissingPath('props.lowStockCount')->assertJsonMissingPath('props.outOfStockCount');
            foreach (DB::getQueryLog() as $query) {
                $this->assertStringNotContainsString('products_count', $query['query']);
                $this->assertStringNotContainsString('minimum_stock', $query['query']);
            }
        } finally {
            DB::disableQueryLog();
        }
        $this->get('/products')->assertInertia(fn ($page) => $page->where('lowStockCount', 1)->where('outOfStockCount', 0)->has('initialCategories'));
    }
}
