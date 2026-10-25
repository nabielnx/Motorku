<?php

declare(strict_types=1);

namespace Tests\Feature\Performance;

use App\Models\Business;
use App\Models\Category;
use App\Models\Product;
use App\Services\BusinessContext;
use App\Services\ProductService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

final class CatalogPagingTest extends TestCase
{
    use RefreshDatabase;

    public function test_initial_catalog_is_bounded_and_other_pages_remain_searchable(): void
    {
        $category = Category::factory()->create();
        Product::factory()->count(61)->create(['category_id' => $category->id, 'name' => 'Common part']);
        $last = Product::factory()->create(['category_id' => $category->id, 'name' => 'Zebra special', 'price' => 1000]);
        $this->get('/')->assertOk()->assertInertia(fn ($page) => $page->has('initialProducts', 60)->where('initialPagination.total', 62));
        $this->getJson('/catalog/products?page=2')->assertOk()->assertJsonCount(2, 'data.products');
        $this->getJson('/catalog/products?search=Zebra')->assertOk()->assertJsonPath('data.products.0.id', $last->id);
        $last->update(['price' => 2000, 'stock' => 3]);
        $this->getJson('/catalog/products?ids[]='.$last->id)->assertOk()
            ->assertJsonPath('data.cart_products.0.price', '2000.00')->assertJsonPath('data.cart_products.0.stock', 3)
            ->assertJsonCount(0, 'data.products');
    }

    public function test_public_catalog_never_returns_another_business_product_even_for_explicit_ids(): void
    {
        $business = Business::create(['name' => 'Foreign', 'slug' => 'foreign-catalog']);
        $foreign = app(BusinessContext::class)->run($business->id, fn () => Product::factory()->create(['cost_price' => 12345]));
        $this->getJson('/catalog/products?ids[]='.$foreign->id)->assertOk()->assertJsonCount(0, 'data.cart_products');
        $this->getJson('/catalog/products?search[]=invalid')->assertUnprocessable();
    }

    public function test_cached_search_metadata_changes_with_product_edits_and_never_caches_prices(): void
    {
        $product = Product::factory()->create(['name' => 'Unique Alpha part', 'price' => 1000, 'description' => null]);
        $service = app(ProductService::class);
        $this->assertTrue($service->getAllProducts(search: 'Alpha')->contains('id', $product->id));
        $product->update(['name' => 'Unique Omega part', 'price' => 2000]);
        $this->assertFalse($service->getAllProducts(search: 'Alpha')->contains('id', $product->id));
        $found = $service->getAllProducts(search: 'Omega')->firstWhere('id', $product->id);
        $this->assertEquals(2000, (float) $found->price);
    }
}
