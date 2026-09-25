<?php

namespace Tests\Feature\Inventory;

use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InventoryTest extends TestCase
{
    use RefreshDatabase;

    private User $owner;

    private User $cashier;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\RoleSeeder::class);

        $this->owner = User::factory()->create();
        $this->owner->assignRole('owner');



        $this->cashier = User::factory()->create();
        $this->cashier->assignRole('cashier');
    }

    public function test_owner_can_list_inventory_logs_test2(): void
    {
        $response = $this->actingAs($this->owner)->getJson('/api/inventory');
        $response->assertStatus(200);
    }

    public function test_cashier_cannot_adjust_inventory_stock(): void
    {
        $product = Product::factory()->create(['stock' => 10]);

        $this->actingAs($this->cashier)->postJson('/api/inventory', [
            'product_id' => $product->id,
            'type' => 'stock_in',
            'quantity' => 5,
        ])->assertStatus(403);
    }

    public function test_owner_can_adjust_stock_in_test2(): void
    {
        $product = Product::factory()->create(['stock' => 10]);

        $response = $this->actingAs($this->owner)->postJson('/api/inventory', [
            'product_id' => $product->id,
            'type' => 'stock_in',
            'quantity' => 15,
            'note' => 'Penerimaan barang dari supplier',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('message', 'Penyesuaian stok berhasil dicatat!');

        $this->assertDatabaseHas('products', [
            'id' => $product->id,
            'stock' => 25,
        ]);

        $this->assertDatabaseHas('inventory_logs', [
            'product_id' => $product->id,
            'type' => 'stock_in',
            'quantity' => 15,
        ]);
    }

    public function test_owner_can_adjust_stock_out_test2(): void
    {
        $product = Product::factory()->create(['stock' => 20]);

        $response = $this->actingAs($this->owner)->postJson('/api/inventory', [
            'product_id' => $product->id,
            'type' => 'stock_out',
            'quantity' => 5,
            'note' => 'Bahan baku kedaluwarsa',
        ]);

        $response->assertStatus(201);

        $this->assertDatabaseHas('products', [
            'id' => $product->id,
            'stock' => 15,
        ]);
    }

    public function test_stock_out_fails_if_insufficient_stock(): void
    {
        $product = Product::factory()->create(['stock' => 5]);

        $response = $this->actingAs($this->owner)->postJson('/api/inventory', [
            'product_id' => $product->id,
            'type' => 'stock_out',
            'quantity' => 50,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors('quantity');
    }

    public function test_opname_sets_actual_stock_and_records_before_after(): void
    {
        $product = Product::factory()->create(['stock' => 10]);

        $this->actingAs($this->owner)->postJson('/api/inventory', [
            'product_id' => $product->id,
            'type' => 'adjustment',
            'quantity' => 7,
        ])->assertCreated();

        $this->assertEquals(7, $product->fresh()->stock);
        $this->assertDatabaseHas('inventory_logs', [
            'product_id' => $product->id,
            'type' => 'adjustment',
            'previous_stock' => 10,
            'new_stock' => 7,
        ]);

        $this->actingAs($this->owner)->postJson('/api/inventory', [
            'product_id' => $product->id,
            'type' => 'adjustment',
            'quantity' => 0,
        ])->assertCreated();

        $this->assertEquals(0, $product->fresh()->stock);
    }

    public function test_inventory_log_cannot_be_edited(): void
    {
        $product = Product::factory()->create(['stock' => 10]);
        $logId = $this->actingAs($this->owner)->postJson('/api/inventory', [
            'product_id' => $product->id,
            'type' => 'stock_in',
            'quantity' => 2,
        ])->assertCreated()->json('data.id');

        $this->actingAs($this->owner)->putJson("/api/inventory/{$logId}", ['quantity' => 50])
            ->assertMethodNotAllowed();
        $this->assertEquals(12, $product->fresh()->stock);
    }

    public function test_stock_return_log_can_only_be_created_by_order_flow(): void
    {
        $product = Product::factory()->create(['stock' => 10]);

        $this->actingAs($this->owner)->postJson('/api/inventory', [
            'product_id' => $product->id,
            'type' => 'stock_return',
            'quantity' => 2,
        ])->assertUnprocessable()->assertJsonValidationErrors('type');

        $this->assertEquals(10, $product->fresh()->stock);
    }
}
