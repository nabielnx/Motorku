<?php

namespace Tests\Feature\Order;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderCrudTest extends TestCase
{
    use RefreshDatabase;

    private User $cashier;
    private User $owner;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\RoleSeeder::class);

        $this->owner = User::factory()->create();
        $this->owner->assignRole('owner');

        $this->cashier = User::factory()->create();
        $this->cashier->assignRole('cashier');
    }

    public function test_cashier_can_list_orders(): void
    {
        $response = $this->actingAs($this->cashier)->getJson('/api/orders');
        $response->assertStatus(200);
    }

    public function test_cashier_can_open_order_detail_from_list(): void
    {
        $order = Order::factory()->create();
        OrderItem::factory()->create(['order_id' => $order->id, 'product_name' => 'Ban IRC Ring 14', 'quantity' => 2]);

        $this->actingAs($this->cashier)
            ->get("/orders/{$order->id}")
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Order/Show')
                ->where('order.id', $order->id)
                ->where('order.order_number', $order->order_number)
                ->where('order.items.0.product_name', 'Ban IRC Ring 14')
                ->where('order.items.0.quantity', 2));

        $this->getJson("/api/orders/{$order->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $order->id)
            ->assertJsonPath('data.order_number', $order->order_number);
    }

    public function test_cashier_can_create_order(): void
    {
        $product = Product::factory()->create();
        $response = $this->actingAs($this->cashier)->postJson('/api/orders', [
            'customer_name' => 'Pelanggan Test',
            'items'      => [['product_id' => $product->id, 'quantity' => 1]],
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('message', 'Pesanan berhasil dibuat!');
    }

    public function test_order_reserves_stock_and_restores_it_when_cancelled(): void
    {
        $product = Product::factory()->create(['stock' => 3, 'is_available' => true]);

        $order = $this->actingAs($this->cashier)->postJson('/api/orders', [
            'customer_name' => 'Pelanggan Test',
            'items' => [['product_id' => $product->id, 'quantity' => 2]],
        ])->assertCreated()->json('data');

        $this->assertDatabaseHas('products', ['id' => $product->id, 'stock' => 1]);

        $this->actingAs($this->owner)
            ->putJson("/api/orders/{$order['id']}", ['order_status' => 'cancelled'])
            ->assertOk();

        $this->assertDatabaseHas('products', ['id' => $product->id, 'stock' => 3]);
    }

    public function test_cashier_cannot_cancel_order(): void
    {
        $order = Order::factory()->create(['order_status' => 'pending']);

        $this->actingAs($this->cashier)
            ->putJson("/api/orders/{$order->id}", ['order_status' => 'cancelled'])
            ->assertForbidden();
    }

    public function test_paid_order_cannot_be_deleted(): void
    {
        $order = Order::factory()->create(['order_status' => 'completed', 'payment_status' => 'paid']);

        $this->actingAs($this->owner)
            ->deleteJson("/api/orders/{$order->id}")
            ->assertForbidden();

        $this->assertDatabaseHas('orders', ['id' => $order->id, 'deleted_at' => null]);
    }

    public function test_cannot_cancel_order_not_in_pending_status(): void
    {
        $order = Order::factory()->create(['order_status' => 'preparing', 'payment_status' => 'paid']);

        $this->actingAs($this->owner)
            ->putJson("/api/orders/{$order->id}", ['order_status' => 'cancelled'])
            ->assertUnprocessable();
    }

    public function test_cashier_cannot_create_order_without_customer_name(): void
    {
        $product = Product::factory()->create();

        $this->actingAs($this->cashier)->postJson('/api/orders', [
            'items' => [['product_id' => $product->id, 'quantity' => 1]],
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('customer_name');
    }

    public function test_cashier_can_update_order_status(): void
    {
        $order    = Order::factory()->create(['order_status' => 'pending', 'payment_status' => 'paid']);
        $response = $this->actingAs($this->cashier)
            ->putJson("/api/orders/{$order->id}", [
                'order_status' => 'preparing',
            ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('orders', [
            'id'           => $order->id,
            'order_status' => 'preparing',
        ]);
    }

    public function test_order_status_transition_pending_to_completed(): void
    {
        $order = Order::factory()->create(['order_status' => 'pending', 'payment_status' => 'paid']);

        foreach (['preparing', 'ready', 'completed'] as $status) {
            $this->actingAs($this->cashier)
                ->putJson("/api/orders/{$order->id}", ['order_status' => $status])
                ->assertStatus(200);
        }

        $this->assertDatabaseHas('orders', [
            'id'           => $order->id,
            'order_status' => 'completed',
        ]);
    }

    public function test_order_cannot_skip_operational_statuses(): void
    {
        $order = Order::factory()->create(['order_status' => 'pending', 'payment_status' => 'paid']);

        $this->actingAs($this->cashier)
            ->putJson("/api/orders/{$order->id}", ['order_status' => 'completed'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('order_status');

        $this->assertDatabaseHas('orders', [
            'id' => $order->id,
            'order_status' => 'pending',
        ]);
    }

    public function test_cannot_update_order_status_if_unpaid(): void
    {
        $order = Order::factory()->create(['order_status' => 'pending', 'payment_status' => 'unpaid']);

        $this->actingAs($this->cashier)
            ->putJson("/api/orders/{$order->id}", ['order_status' => 'preparing'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('payment_status');

        $this->assertDatabaseHas('orders', [
            'id' => $order->id,
            'order_status' => 'pending',
        ]);
    }

    public function test_guest_cannot_access_orders(): void
    {
        $response = $this->getJson('/api/orders');
        $response->assertStatus(401);
    }
}
