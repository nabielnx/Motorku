<?php

namespace Tests\Feature\Product;

use App\Models\Category;
use App\Models\Motorcycle;
use App\Models\MotorcyclePart;
use App\Models\Product;
use App\Services\CatalogSearchService;
use App\Services\MotorcycleService;
use App\Services\ProductService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CatalogSearchTest extends TestCase
{
    use RefreshDatabase;

    public function test_shared_customer_and_admin_corpus(): void
    {
        $search = app(CatalogSearchService::class);
        $fixtures = json_decode(file_get_contents(base_path('tests/fixtures/catalog-search.json')), true, 512, JSON_THROW_ON_ERROR);
        foreach ($fixtures as $fixture) {
            foreach ($fixture['yes'] as $query) {
                $this->assertGreaterThan(0, $search->score($fixture['item'], $query), ($fixture['item']['name'] ?? $fixture['item']['model']).': '.$query);
            }
            foreach ($fixture['no'] as $query) {
                $this->assertSame(0.0, $search->score($fixture['item'], $query), ($fixture['item']['name'] ?? $fixture['item']['model']).': '.$query);
            }
        }
    }

    public function test_database_search_keeps_filters_pagination_sorting_and_current_data(): void
    {
        $category = Category::factory()->create(['name' => 'Pengereman']);
        $other = Category::factory()->create(['name' => 'Sepeda']);
        $exact = Product::factory()->create(['name' => 'Kampas Rem Honda', 'sku' => 'PAD-HONDA-EXACT', 'category_id' => $category->id, 'description' => null, 'price' => 90000]);
        $synonym = Product::factory()->create(['name' => 'Honda Brake Pad', 'sku' => 'PAD-HONDA-ENGLISH', 'category_id' => $category->id, 'description' => null, 'price' => 30000]);
        Product::factory()->create(['name' => 'Honda Brake Pad Sepeda', 'sku' => 'PAD-SEPEDA', 'category_id' => $other->id, 'description' => null]);
        $service = app(ProductService::class);

        $results = $service->getProductsForWeb('kampas rem honda', 'Pengereman');
        $this->assertSame(2, $results->total());
        $this->assertSame([$exact->id, $synonym->id], collect($results->items())->pluck('id')->all());
        $sorted = $service->getProductsForWeb('rem honda kampas', 'Pengereman', sort: 'price_asc');
        $this->assertSame([$synonym->id, $exact->id], collect($sorted->items())->pluck('id')->all());
        $this->assertCount(0, $service->getAllProducts(search: '%'));
        $this->assertCount(0, $service->getAllProducts(search: '0'));
        $synonym->update(['name' => 'Honda Engine Oil']);
        $this->assertFalse($service->getAllProducts(search: 'kampas rem')->contains('id', $synonym->id));
        $this->assertTrue($service->getAllProducts(search: 'oli mesin')->contains('id', $synonym->id));
    }

    public function test_motorcycle_search_combines_product_metadata_and_notes_with_motorcycle_scope(): void
    {
        $motor = Motorcycle::create(['brand' => 'Honda', 'model' => 'ADV 150', 'slug' => 'adv-150', 'engine_cc' => 150, 'engine_type' => 'matic', 'year_start' => 2020]);
        $other = Motorcycle::create(['brand' => 'Honda', 'model' => 'ADV 160', 'slug' => 'adv-160', 'engine_cc' => 160, 'engine_type' => 'matic', 'year_start' => 2023]);
        $product = Product::factory()->create(['name' => 'Brake Pad', 'description' => null]);
        $part = MotorcyclePart::create(['motorcycle_id' => $motor->id, 'product_id' => $product->id, 'part_category' => 'kampas_rem', 'notes' => 'Belakang']);
        MotorcyclePart::create(['motorcycle_id' => $other->id, 'product_id' => $product->id, 'part_category' => 'kampas_rem', 'notes' => 'Depan']);
        $result = app(MotorcycleService::class)->getMotorcycleParts($motor->id, ['search' => 'rear kampas rem']);
        $this->assertSame([$part->id], collect($result['data'])->pluck('id')->all());
        $empty = app(MotorcycleService::class)->getMotorcycleParts($motor->id, ['search' => 'front kampas rem']);
        $this->assertSame(0, $empty['total']);
    }

    public function test_search_crosses_batches_and_paginates_without_losing_scope(): void
    {
        $category = Category::factory()->create(['catalog_group' => 'automotive']);
        Product::factory()->count(275)->create(['name' => 'Honda Brake Pad', 'category_id' => $category->id, 'description' => null]);
        $other = Category::factory()->create(['catalog_group' => 'electronics']);
        Product::factory()->create(['name' => 'Honda Brake Pad', 'category_id' => $other->id]);
        $results = app(ProductService::class)->getProductsForWeb('kampas rem honda', group: 'automotive');
        $this->assertSame(275, $results->total());
        $this->assertCount(16, $results->items());
        $this->assertTrue(collect($results->items())->every(fn ($product) => $product->category_id === $category->id));
    }

    public function test_public_search_metadata_excludes_purchase_cost(): void
    {
        $parent = Category::factory()->create(['name' => 'Elektronik']);
        $category = Category::factory()->create(['name' => 'Kapasitor', 'parent_id' => $parent->id]);
        $product = Product::factory()->create(['name' => 'Premium X900', 'category_id' => $category->id, 'brand' => 'Acme', 'barcode' => '899000123', 'unit' => 'pcs', 'cost_price' => 12345]);
        $this->get('/')->assertOk()->assertInertia(fn ($page) => $page
            ->where('initialProducts.0.brand', 'Acme')
            ->where('initialProducts.0.barcode', '899000123')
            ->where('initialProducts.0.category.parent.name', 'Elektronik')
            ->missing('initialProducts.0.cost_price'));
        $this->assertTrue(app(ProductService::class)->getAllProducts(search: 'acme capacitor')->contains('id', $product->id));
    }
}
