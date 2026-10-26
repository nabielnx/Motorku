<?php

declare(strict_types=1);

namespace Tests\Feature\Performance;

use App\Models\Business;
use App\Models\Category;
use App\Models\Motorcycle;
use App\Models\MotorcyclePart;
use App\Models\Product;
use App\Services\BusinessContext;
use App\Services\CatalogPageService;
use App\Services\ProductService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

final class SearchMetadataTest extends TestCase
{
    use RefreshDatabase;

    public static function cacheStores(): array
    {
        return [['array'], ['database']];
    }

    #[DataProvider('cacheStores')]
    public function test_fitment_edits_removal_and_current_prices_survive_warm_document_cache(string $store): void
    {
        config(['cache.default' => $store]);
        Cache::purge($store);
        $category = Category::factory()->create(['name' => 'Generic']);
        $product = Product::factory()->create(['name' => 'Neutral component', 'description' => null, 'category_id' => $category->id, 'price' => 1000, 'stock' => 10]);
        $motor = Motorcycle::create(['brand' => 'Acme', 'model' => 'Falcon550', 'slug' => 'falcon-550', 'year_start' => 2020, 'engine_cc' => 110]);
        $service = app(ProductService::class);
        $this->assertTrue($service->getAllProducts(search: 'Falcon550')->isEmpty());
        $part = MotorcyclePart::create(['product_id' => $product->id, 'motorcycle_id' => $motor->id, 'part_category' => 'other']);
        $this->assertSame([$product->id], $service->getAllProducts(search: 'Falcon550')->pluck('id')->all());

        $motor->update(['model' => 'Heron660']);
        $this->assertTrue($service->getAllProducts(search: 'Falcon550')->isEmpty());
        $product->update(['price' => 2000, 'stock' => 3]);
        $found = $service->getAllProducts(search: 'Heron660')->sole();
        $this->assertSame($product->id, $found->id);
        $this->assertEquals(2000, (float) $found->price);
        $this->assertSame(3, $found->stock);

        $category->update(['name' => 'Custodiantoken']);
        $this->assertSame([$product->id], $service->getAllProducts(search: 'Custodiantoken')->pluck('id')->all());
        $part->delete();
        $this->assertTrue($service->getAllProducts(search: 'Heron660')->isEmpty());
    }

    public function test_search_scopes_both_mapping_and_motor_even_for_inconsistent_historical_links(): void
    {
        $context = app(BusinessContext::class);
        $product = Product::factory()->create(['name' => 'Neutral component', 'description' => null]);
        $ownMotor = Motorcycle::create(['brand' => 'Acme', 'model' => 'Solaris990', 'slug' => 'solaris-990', 'year_start' => 2020, 'engine_cc' => 110]);
        $business = Business::create(['name' => 'Other fixture business', 'slug' => 'search-fixture-other']);
        [$foreignProduct, $foreignMotor] = $context->run($business->id, function (): array {
            $foreignProduct = Product::factory()->create(['name' => 'Foreign component', 'description' => null]);
            $foreignMotor = Motorcycle::create(['brand' => 'Acme', 'model' => 'Nebulosa880', 'slug' => 'nebulosa-880', 'year_start' => 2020, 'engine_cc' => 110]);
            MotorcyclePart::create(['product_id' => $foreignProduct->id, 'motorcycle_id' => $foreignMotor->id, 'part_category' => 'other']);

            return [$foreignProduct, $foreignMotor];
        });
        DB::table('motorcycle_parts')->insert([
            ['id' => (string) Str::uuid(), 'business_id' => $context->id(),
                'product_id' => $product->id, 'motorcycle_id' => $foreignMotor->id, 'part_category' => 'other'],
            ['id' => (string) Str::uuid(), 'business_id' => $business->id,
                'product_id' => $product->id, 'motorcycle_id' => $ownMotor->id, 'part_category' => 'other'],
        ]);
        $this->assertTrue(app(ProductService::class)->getAllProducts(search: 'Nebulosa880')->isEmpty());
        $this->assertTrue(app(ProductService::class)->getAllProducts(search: 'Solaris990')->isEmpty());
        $context->run($business->id, function () use ($foreignProduct): void {
            $this->assertSame([$foreignProduct->id], app(ProductService::class)->getAllProducts(search: 'Nebulosa880')->pluck('id')->all());
        });
    }

    #[DataProvider('cacheStores')]
    public function test_search_crosses_metadata_batches_with_bounded_queries_and_no_page_overlap(string $store): void
    {
        config(['cache.default' => $store]);
        Cache::purge($store);
        $category = Category::factory()->create(['name' => 'Generic']);
        $motor = Motorcycle::create(['brand' => 'Acme', 'model' => 'Falcon550', 'slug' => 'falcon-550', 'year_start' => 2020, 'engine_cc' => 110]);
        $products = $parts = [];
        foreach (range(1, 1005) as $index) {
            $id = (string) Str::uuid();
            $products[] = ['id' => $id, 'business_id' => BusinessContext::LEGACY_ID, 'category_id' => $category->id, 'name' => 'Metadata item '.$index, 'sku' => 'META-'.$index, 'price' => $index, 'stock' => 1, 'is_available' => true];
            $parts[] = ['id' => (string) Str::uuid(), 'business_id' => BusinessContext::LEGACY_ID, 'product_id' => $id, 'motorcycle_id' => $motor->id, 'part_category' => 'other'];
        }
        foreach (['products' => $products, 'motorcycle_parts' => $parts] as $table => $rows) {
            foreach (array_chunk($rows, 250) as $chunk) {
                DB::table($table)->insert($chunk);
            }
        }
        app(ProductService::class)->getProductsForWeb('Falcon550');
        DB::enableQueryLog();
        DB::flushQueryLog();
        try {
            $results = app(ProductService::class)->getProductsForWeb('Falcon550');
            $this->assertSame(1005, $results->total());
            $queries = DB::getQueryLog();
            $this->assertLessThanOrEqual($store === 'database' ? 30 : 20, count($queries));
            foreach ($queries as $query) {
                if (str_contains($query['query'], 'from `cache`')) {
                    $this->assertLessThanOrEqual(100, count($query['bindings']));
                }
            }
        } finally {
            DB::disableQueryLog();
        }
        $first = app(CatalogPageService::class)->page(['search' => 'Falcon550', 'page' => 1]);
        $second = app(CatalogPageService::class)->page(['search' => 'Falcon550', 'page' => 2]);
        $this->assertSame(1005, $second['pagination']['total']);
        $this->assertCount(60, $first['products']);
        $this->assertCount(60, $second['products']);
        $this->assertSame([], array_intersect(array_column($first['products'], 'id'), array_column($second['products'], 'id')));
    }
}
