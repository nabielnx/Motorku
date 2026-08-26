<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\InventoryLog;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class ProductionReadinessTest extends TestCase
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

    #[Test]
    public function owner_only_endpoints_reject_cashier_access(): void
    {
        $product = Product::factory()->create();
        $category = Category::factory()->create();
        $staff = User::factory()->create();

        // Products / Categories
        $this->actingAs($this->cashier)->get('/products')->assertForbidden();
        $this->actingAs($this->cashier)->postJson('/api/products', ['name' => 'Test'])->assertForbidden();
        $this->actingAs($this->cashier)->postJson('/api/categories', ['name' => 'Test'])->assertForbidden();

        // Users / Staff
        $this->actingAs($this->cashier)->getJson('/api/users')->assertForbidden();
        $this->actingAs($this->cashier)->get('/users')->assertForbidden();

        // Inventory
        $this->actingAs($this->cashier)->get('/inventory')->assertForbidden();
        $this->actingAs($this->cashier)->postJson('/api/inventory', ['product_id' => $product->id, 'type' => 'stock_in', 'quantity' => 10])->assertForbidden();

        // Reports
        $this->actingAs($this->cashier)->get('/reports')->assertForbidden();
    }

    #[Test]
    public function cash_payment_marks_order_paid_then_can_transition_to_completed(): void
    {
        $order = Order::factory()->create([
            'total' => 50000,
            'payment_status' => 'unpaid',
            'order_status' => 'pending',
        ]);

        $response = $this->actingAs($this->cashier)->postJson('/api/payments', [
            'order_id' => $order->id,
            'payment_method' => 'cash',
            'amount_received' => 50000,
        ]);

        $response->assertCreated();

        $this->assertDatabaseHas('orders', [
            'id' => $order->id,
            'payment_status' => 'paid',
            'order_status' => 'pending',
        ]);

        foreach (['preparing', 'ready', 'completed'] as $status) {
            $this->actingAs($this->cashier)->putJson("/api/orders/{$order->id}", ['order_status' => $status])->assertStatus(200);
        }

        $this->assertDatabaseHas('orders', [
            'id' => $order->id,
            'order_status' => 'completed',
        ]);
    }

    #[Test]
    public function inventory_log_cannot_be_deleted_via_api(): void
    {
        $product = Product::factory()->create();
        $log = InventoryLog::create([
            'product_id' => $product->id,
            'type' => 'stock_in',
            'quantity' => 5,
            'note' => 'Initial stock',
        ]);

        $this->actingAs($this->owner)
            ->deleteJson("/api/inventory/{$log->id}")
            ->assertForbidden()
            ->assertJsonPath('message', 'Log inventori tidak dapat dihapus. Buat entri koreksi baru untuk memperbaiki stok.');
    }

    #[Test]
    public function order_cancelled_is_restricted_to_owner_and_pending_status_only(): void
    {
        $orderPending = Order::factory()->create(['order_status' => 'pending']);
        $orderProcessing = Order::factory()->create(['order_status' => 'preparing', 'payment_status' => 'paid']);

        // Cashier cannot cancel pending order -> 403
        $this->actingAs($this->cashier)
            ->putJson("/api/orders/{$orderPending->id}", ['order_status' => 'cancelled'])
            ->assertForbidden();

        // Owner cannot cancel non-pending order -> 422
        $this->actingAs($this->owner)
            ->putJson("/api/orders/{$orderProcessing->id}", ['order_status' => 'cancelled'])
            ->assertUnprocessable()
            ->assertJsonPath('message', 'Pesanan hanya dapat dibatalkan jika masih berstatus pending.');

        // Owner CAN cancel pending order -> 200
        $this->actingAs($this->owner)
            ->putJson("/api/orders/{$orderPending->id}", ['order_status' => 'cancelled'])
            ->assertOk();

        $this->assertDatabaseHas('orders', [
            'id' => $orderPending->id,
            'order_status' => 'cancelled',
        ]);
    }
}
