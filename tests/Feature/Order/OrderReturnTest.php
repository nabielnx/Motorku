<?php

namespace Tests\Feature\Order;

use App\Models\Order;
use App\Models\Product;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class OrderReturnTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_can_return_one_item_without_changing_other_items(): void
    {
        Role::findOrCreate('owner', 'web');
        $owner = User::factory()->create();
        $owner->assignRole('owner');
        $first = Product::factory()->create(['stock' => 5, 'price' => 10000]);
        $second = Product::factory()->create(['stock' => 5, 'price' => 20000]);

        $this->actingAs($owner)->postJson('/api/orders/pos-sale', [
            'items' => [
                ['product_id' => $first->id, 'quantity' => 1],
                ['product_id' => $second->id, 'quantity' => 1],
            ],
            'amount_received' => 30000,
        ])->assertCreated();

        $order = Order::with('items')->firstOrFail();
        $firstItem = $order->items->firstWhere('product_id', $first->id);
        $requestId = fake()->uuid();

        $this->actingAs($owner)->postJson("/api/orders/{$order->id}/returns", [
            'request_id' => $requestId,
            'order_item_id' => $firstItem->id,
            'quantity' => 1,
            'restock' => true,
            'cash_refunded' => true,
            'reason' => 'Ukuran tidak cocok',
        ])->assertCreated()
            ->assertJsonPath('data.payment_status', 'paid')
            ->assertJsonPath('data.returns.0.amount', 10000);

        $this->assertEquals(5, $first->fresh()->stock);
        $this->assertEquals(4, $second->fresh()->stock);
        $this->assertDatabaseHas('inventory_logs', ['product_id' => $first->id, 'type' => 'stock_return']);

        $this->actingAs($owner)->postJson("/api/orders/{$order->id}/returns", [
            'request_id' => $requestId,
            'order_item_id' => $firstItem->id,
            'quantity' => 1,
            'restock' => true,
            'cash_refunded' => true,
            'reason' => 'Ukuran tidak cocok',
        ])->assertCreated();

        $this->actingAs($owner)->postJson("/api/orders/{$order->id}/returns", [
            'request_id' => fake()->uuid(),
            'order_item_id' => $firstItem->id,
            'quantity' => 1,
            'restock' => true,
            'cash_refunded' => true,
            'reason' => 'Coba dua kali',
        ])->assertUnprocessable();
        $this->assertDatabaseCount('order_returns', 1);
    }

    public function test_full_return_marks_order_refunded_without_restocking_damaged_item(): void
    {
        Role::findOrCreate('owner', 'web');
        $owner = User::factory()->create();
        $owner->assignRole('owner');
        $product = Product::factory()->create(['stock' => 5, 'price' => 15000]);

        $this->actingAs($owner)->postJson('/api/orders/pos-sale', [
            'items' => [['product_id' => $product->id, 'quantity' => 1]],
            'amount_received' => 15000,
        ])->assertCreated();

        $order = Order::with('items')->firstOrFail();
        $this->actingAs($owner)->postJson("/api/orders/{$order->id}/returns", [
            'request_id' => fake()->uuid(),
            'order_item_id' => $order->items->first()->id,
            'quantity' => 1,
            'restock' => false,
            'cash_refunded' => true,
            'reason' => 'Barang rusak',
        ])->assertCreated()->assertJsonPath('data.payment_status', 'refunded');

        $this->assertEquals(4, $product->fresh()->stock);
        $this->assertDatabaseHas('order_returns', ['order_id' => $order->id, 'restocked' => false, 'amount' => 15000]);
    }

    public function test_cashier_cannot_record_return(): void
    {
        Role::findOrCreate('cashier', 'web');
        $cashier = User::factory()->create();
        $cashier->assignRole('cashier');

        $this->actingAs($cashier)->postJson('/api/orders/'.fake()->uuid().'/returns', [
            'request_id' => fake()->uuid(),
            'order_item_id' => fake()->uuid(),
            'quantity' => 1,
            'restock' => true,
            'cash_refunded' => true,
            'reason' => 'Test',
        ])->assertForbidden();
    }

    public function test_partial_returns_refund_proportional_tax_and_full_total(): void
    {
        Role::findOrCreate('owner', 'web');
        $owner = User::factory()->create();
        $owner->assignRole('owner');
        Setting::create(['group' => 'tax', 'key' => 'percentage', 'value' => '10']);
        $first = Product::factory()->create(['stock' => 2, 'price' => 10000]);
        $second = Product::factory()->create(['stock' => 2, 'price' => 10000]);

        $this->actingAs($owner)->postJson('/api/orders/pos-sale', [
            'items' => [
                ['product_id' => $first->id, 'quantity' => 1],
                ['product_id' => $second->id, 'quantity' => 1],
            ],
            'amount_received' => 22000,
        ])->assertCreated();
        $order = Order::with('items')->firstOrFail();

        foreach ($order->items as $item) {
            $this->actingAs($owner)->postJson("/api/orders/{$order->id}/returns", [
                'request_id' => fake()->uuid(),
                'order_item_id' => $item->id,
                'quantity' => 1,
                'restock' => true,
                'cash_refunded' => true,
                'reason' => 'Tidak cocok',
            ])->assertCreated();
        }

        $this->assertEquals(22000, $order->returns()->sum('amount'));
        $this->assertEquals('refunded', $order->fresh()->payment_status->value);
    }
}
