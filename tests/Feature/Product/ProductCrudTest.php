<?php

namespace Tests\Feature\Product;

use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductCrudTest extends TestCase
{
    use RefreshDatabase;

    private User $owner;
    private User $cashier;
    private Category $category;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\RoleSeeder::class);

        $this->owner = User::factory()->create();
        $this->owner->assignRole('owner');

        $this->cashier = User::factory()->create();
        $this->cashier->assignRole('cashier');

        $this->category = Category::factory()->create();
    }

    public function test_any_authenticated_user_can_list_products(): void
    {
        Product::factory()->count(5)->create();
        $response = $this->actingAs($this->cashier)->getJson('/api/products');
        $response->assertStatus(200);
    }

    public function test_owner_can_create_product(): void
    {
        $response = $this->actingAs($this->owner)->postJson('/api/products', [
            'name'        => 'Ayam Goreng',
            'sku'         => 'AYAM-GORENG',
            'price'       => 25000,
            'category_id' => $this->category->id,
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('products', ['name' => 'Ayam Goreng']);
    }

    public function test_cashier_cannot_create_product(): void
    {
        $response = $this->actingAs($this->cashier)->postJson('/api/products', [
            'name'  => 'Produk Ilegal',
            'price' => 99999,
        ]);
        $response->assertStatus(403);
    }

    public function test_owner_can_update_product(): void
    {
        $product  = Product::factory()->create();
        $response = $this->actingAs($this->owner)
            ->putJson("/api/products/{$product->id}", ['name' => 'Ayam Bakar']);

        $response->assertStatus(200);
        $this->assertDatabaseHas('products', ['name' => 'Ayam Bakar']);
    }

    public function test_product_edit_cannot_change_stock_without_a_stock_log(): void
    {
        $product = Product::factory()->create(['stock' => 10]);

        $this->actingAs($this->owner)
            ->putJson("/api/products/{$product->id}", ['stock' => 99])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('stock');

        $this->assertEquals(10, $product->fresh()->stock);
    }

    public function test_owner_can_delete_product(): void
    {
        $product  = Product::factory()->create();
        $response = $this->actingAs($this->owner)
            ->deleteJson("/api/products/{$product->id}");

        $response->assertStatus(200);
        $this->assertSoftDeleted('products', ['id' => $product->id]);
    }

    public function test_owner_can_create_product_with_custom_stock_and_minimum_stock(): void
    {
        $response = $this->actingAs($this->owner)->postJson('/api/products', [
            'name'          => 'Kampas Rem Vario',
            'sku'           => 'KMP-VARIO-01',
            'price'         => 35000,
            'category_id'   => $this->category->id,
            'stock'         => 15,
            'minimum_stock' => 5,
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('products', [
            'name'          => 'Kampas Rem Vario',
            'stock'         => 15,
            'minimum_stock' => 5,
        ]);
    }

    public function test_owner_accessing_inventory_is_redirected_to_products(): void
    {
        $response = $this->actingAs($this->owner)->get('/inventory');
        $response->assertRedirect(route('products.index'));
    }

    public function test_owner_can_filter_products_by_stock_status(): void
    {
        Product::factory()->create([
            'category_id'   => $this->category->id,
            'stock'         => 1,
            'minimum_stock' => 5,
        ]);
        Product::factory()->create([
            'category_id'   => $this->category->id,
            'stock'         => 50,
            'minimum_stock' => 5,
        ]);

        $response = $this->actingAs($this->owner)->get('/products?stock_status=low');
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Product/Index')
            ->has('lowStockCount')
            ->has('outOfStockCount')
            ->where('filters.stock_status', 'low')
        );
    }

    public function test_product_filters_and_sorting_apply_before_pagination(): void
    {
        $parent = Category::factory()->create(['name' => 'Oli & Pelumas']);
        $child = Category::factory()->create(['name' => 'Oli Mesin', 'parent_id' => $parent->id]);

        for ($i = 18; $i >= 1; $i--) {
            Product::factory()->create([
                'category_id' => $child->id,
                'name' => sprintf('Oli %02d', $i),
                'price' => $i * 1000,
                'is_available' => true,
            ]);
        }

        Product::factory()->create([
            'category_id' => $child->id,
            'name' => 'Oli Nonaktif',
            'is_available' => false,
        ]);

        $query = '?category=Oli%20%26%20Pelumas&availability=active&sort=name_asc';
        $first = $this->actingAs($this->owner)->get('/products'.$query);
        $first->assertOk()->assertInertia(fn ($page) => $page
            ->where('initialProducts.total', 18)
            ->where('initialProducts.data.0.name', 'Oli 01')
            ->where('initialProducts.data.15.name', 'Oli 16')
        );

        $this->get('/products'.$query.'&page=2')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('initialProducts.data.0.name', 'Oli 17')
                ->where('initialProducts.data.1.name', 'Oli 18')
            );

        $this->get('/products?category=Oli%20%26%20Pelumas&availability=active&sort=price_desc')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('initialProducts.data.0.name', 'Oli 18'));
    }

    public function test_stock_filters_separate_low_out_and_normal(): void
    {
        foreach ([0, 2, 10] as $stock) {
            Product::factory()->create([
                'category_id' => $this->category->id,
                'stock' => $stock,
                'minimum_stock' => 5,
            ]);
        }

        foreach (['low', 'out', 'normal'] as $status) {
            $this->actingAs($this->owner)->get('/products?stock_status='.$status)
                ->assertOk()
                ->assertInertia(fn ($page) => $page->where('initialProducts.total', 1));
        }
    }
}
