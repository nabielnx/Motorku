<?php

namespace Tests\Feature\Report;

use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class CashClosingTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_can_reconcile_cash_sales_and_returns_once_per_day(): void
    {
        $this->seed(\Database\Seeders\RoleSeeder::class);
        $owner = User::factory()->create();
        $owner->assignRole('owner');
        $product = Product::factory()->create(['stock' => 5, 'price' => 30000]);

        $this->actingAs($owner)->postJson('/api/orders/pos-sale', [
            'items' => [['product_id' => $product->id, 'quantity' => 1]],
            'amount_received' => 50000,
        ])->assertCreated();
        $order = Order::with('items')->firstOrFail();

        $this->actingAs($owner)->postJson("/api/orders/{$order->id}/returns", [
            'request_id' => fake()->uuid(),
            'order_item_id' => $order->items->first()->id,
            'quantity' => 1,
            'restock' => true,
            'cash_refunded' => true,
            'reason' => 'Tidak cocok',
        ])->assertCreated();

        $date = now()->toDateString();
        $this->actingAs($owner)->getJson("/api/reports/cash?date={$date}")
            ->assertOk()->assertJsonPath('data.cash_sales', 30000)->assertJsonPath('data.cash_returns', 30000);
        $this->actingAs($owner)->getJson("/api/reports?start_date={$date}&end_date={$date}")
            ->assertOk()->assertJsonPath('data.revenue', 0);

        $this->actingAs($owner)->postJson('/api/reports/cash/close', [
            'date' => $date,
            'opening_cash' => 50000,
            'cash_out' => 5000,
            'actual_cash' => 44000,
        ])->assertCreated()
            ->assertJsonPath('data.expected_cash', 45000)
            ->assertJsonPath('data.difference', -1000);

        $this->actingAs($owner)->postJson('/api/reports/cash/close', [
            'date' => $date,
            'opening_cash' => 0,
            'cash_out' => 0,
            'actual_cash' => 0,
        ])->assertUnprocessable();
        $this->assertDatabaseCount('cash_closings', 1);
    }

    public function test_cashier_cannot_close_cash(): void
    {
        Role::findOrCreate('cashier', 'web');
        $cashier = User::factory()->create();
        $cashier->assignRole('cashier');

        $this->actingAs($cashier)->postJson('/api/reports/cash/close', [
            'date' => now()->toDateString(),
            'opening_cash' => 0,
            'cash_out' => 0,
            'actual_cash' => 0,
        ])->assertForbidden();
    }
}
