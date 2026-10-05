<?php

namespace Tests\Feature\Product;

use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use App\Services\CategoryService;
use App\Services\ProductService;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CatalogGroupTest extends TestCase
{
    use RefreshDatabase;

    public function test_grid_page_size_keeps_rows_full_and_limits_requested_size(): void
    {
        Product::factory()->count(25)->create();
        $service = app(ProductService::class);
        foreach ([16, 18, 20] as $size) {
            $page = $service->getProductsForWeb(perPage: $size);
            $this->assertSame($size, $page->perPage());
            $this->assertCount($size, $page->items());
        }
        $this->assertSame(16, $service->getProductsForWeb(perPage: 999)->perPage());
    }

    public function test_group_uses_parent_category_and_keeps_the_same_product_stock(): void
    {
        $root = Category::factory()->create(['catalog_group' => 'electronics']);
        $child = Category::factory()->create(['parent_id' => $root->id]);
        $product = Product::factory()->create(['category_id' => $child->id, 'stock' => 12]);
        Product::factory()->create();
        $service = app(ProductService::class);
        $this->assertSame([$product->id], $service->getProductsForWeb(group: 'electronics')->pluck('id')->all());
        $this->assertSame(12, $service->getProductsForWeb(group: 'electronics')->first()->stock);
        app(CategoryService::class)->updateCategory($root->id, ['name' => $root->name, 'catalog_group' => 'hardware']);
        $this->assertSame(0, $service->getProductsForWeb(group: 'electronics')->total());
        $this->assertSame([$product->id], $service->getProductsForWeb(group: 'hardware')->pluck('id')->all());
    }

    public function test_owner_can_choose_a_group_and_invalid_groups_are_rejected(): void
    {
        $this->seed(RoleSeeder::class);
        $owner = User::factory()->create();
        $owner->assignRole('owner');
        $this->actingAs($owner)->postJson('/api/categories', ['name' => 'Perkakas', 'catalog_group' => 'hardware'])->assertCreated();
        $this->assertDatabaseHas('categories', ['name' => 'Perkakas', 'catalog_group' => 'hardware']);
        $this->postJson('/api/categories', ['name' => 'Invalid', 'catalog_group' => 'invalid'])->assertUnprocessable();
        $this->get('/products?group=invalid')->assertUnprocessable();
    }

    public function test_group_page_scopes_categories_products_and_stock_alerts(): void
    {
        $this->seed(RoleSeeder::class);
        $owner = User::factory()->create();
        $owner->assignRole('owner');
        $category = Category::factory()->create(['catalog_group' => 'electronics']);
        Product::factory()->create(['category_id' => $category->id, 'stock' => 0]);
        Product::factory()->create(['stock' => 0]);
        $this->actingAs($owner)->get('/products?group=electronics')->assertOk()->assertInertia(fn ($page) => $page
            ->component('Product/Index')
            ->where('filters.group', 'electronics')
            ->has('initialCategories', 1)
            ->where('initialProducts.total', 1)
            ->where('outOfStockCount', 1));
    }
}
