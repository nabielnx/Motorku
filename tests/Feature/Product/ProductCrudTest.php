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

    public function test_owner_can_delete_product(): void
    {
        $product  = Product::factory()->create();
        $response = $this->actingAs($this->owner)
            ->deleteJson("/api/products/{$product->id}");

        $response->assertStatus(200);
        $this->assertSoftDeleted('products', ['id' => $product->id]);
    }
}
