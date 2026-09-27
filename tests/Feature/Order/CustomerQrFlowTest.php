<?php

namespace Tests\Feature\Order;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class CustomerQrFlowTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function full_qr_order_flow(): void
    {
        $product = Product::factory()->create(['is_available' => true, 'stock' => 10]);

        // Katalog tersedia di halaman utama
        $this->get('/')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Order/Menu'));

        $orderResponse = $this->postJson('/api/customer/order', [
            'customer_name' => 'Pelanggan Test',
            'items' => [
                ['product_id' => $product->id, 'quantity' => 2, 'notes' => 'Besi cor'],
                ['product_id' => $product->id, 'quantity' => 1, 'notes' => 'Baja ringan'],
            ],
        ]);

        $orderResponse->assertCreated()
            ->assertJsonStructure(['data' => ['id', 'order_number', 'total', 'customer_token']]);
        $this->assertDatabaseCount('order_items', 2);

        // A customer may order in the same browser where a cashier is logged in.
        $this->actingAs(User::factory()->create());
        $authenticatedOrder = $this->postJson('/api/customer/order', [
            'customer_name' => 'Pelanggan Login',
            'items' => [['product_id' => $product->id, 'quantity' => 1]],
        ]);
        $authenticatedOrder->assertCreated()->assertJsonPath('data.customer_token', fn ($token) => is_string($token) && strlen($token) === 64);

        $orderId = $orderResponse->json('data.id');
        $customerToken = $orderResponse->json('data.customer_token');

        $this->getJson("/api/customer/order/{$orderId}/status?customer_token={$customerToken}")
            ->assertOk()
            ->assertJsonPath('data.order_status', 'pending');

        Order::whereKey($orderId)->update(['order_status' => 'preparing']);

        $this->getJson("/api/customer/order/{$orderId}/status?customer_token={$customerToken}")
            ->assertOk()
            ->assertJsonPath('data.order_status', 'preparing');
    }

    #[Test]
    public function order_status_returns_401_without_customer_token(): void
    {
        $order = Order::factory()->create();

        $this->getJson("/api/customer/order/{$order->id}/status")
            ->assertStatus(401)
            ->assertJsonPath('message', 'Akses ditolak. Token tidak ditemukan.');
    }

    #[Test]
    public function public_order_rejects_excessive_quantity_without_reserving_stock(): void
    {
        $product = Product::factory()->create(['stock' => 100, 'is_available' => true]);

        $this->postJson('/api/customer/order', [
            'customer_name' => 'Pembeli',
            'items' => [['product_id' => $product->id, 'quantity' => 11]],
        ])->assertUnprocessable();

        $this->assertEquals(100, $product->fresh()->stock);
    }

    #[Test]
    public function storefront_best_sellers_only_count_paid_orders(): void
    {
        $unpaidProduct = Product::factory()->create();
        $paidProduct = Product::factory()->create();
        $unpaid = Order::factory()->create(['order_status' => 'pending', 'payment_status' => 'unpaid']);
        $paid = Order::factory()->create(['order_status' => 'completed', 'payment_status' => 'paid']);
        OrderItem::factory()->create(['order_id' => $unpaid->id, 'product_id' => $unpaidProduct->id, 'quantity' => 20]);
        OrderItem::factory()->create(['order_id' => $paid->id, 'product_id' => $paidProduct->id, 'quantity' => 1]);
        Payment::factory()->create(['order_id' => $paid->id, 'status' => 'paid', 'paid_at' => now()]);

        $this->get('/')->assertOk()->assertInertia(fn ($page) => $page
            ->where('bestSellerProductIds', [$paidProduct->id]));
    }

    #[Test]
    public function customer_checkout_only_offers_payment_at_store(): void
    {
        $this->get('/payment')->assertOk()->assertInertia(fn ($page) => $page
            ->component('Payment/Index'));
        $this->get('/payment/qris')->assertNotFound();
    }

    #[Test]
    public function customer_can_cancel_unpaid_pending_order(): void
    {
        $product = Product::factory()->create(['stock' => 10, 'is_available' => true]);

        $orderResponse = $this->postJson('/api/customer/order', [
            'customer_name' => 'Pelanggan Batal',
            'items' => [['product_id' => $product->id, 'quantity' => 2]],
        ]);

        $orderId = $orderResponse->json('data.id');
        $customerToken = $orderResponse->json('data.customer_token');

        $this->assertEquals(8, $product->fresh()->stock);

        $cancelResponse = $this->postJson("/api/customer/order/{$orderId}/cancel", [
            'customer_token' => $customerToken,
        ]);

        $cancelResponse->assertOk()
            ->assertJsonPath('data.order_status', 'cancelled');

        $this->assertDatabaseHas('orders', [
            'id' => $orderId,
            'order_status' => 'cancelled',
        ]);

        $this->assertEquals(10, $product->fresh()->stock);
        $this->assertDatabaseHas('inventory_logs', [
            'product_id' => $product->id,
            'type' => 'stock_return',
            'quantity' => 2,
        ]);

        $this->postJson("/api/customer/order/{$orderId}/cancel", [
            'customer_token' => $customerToken,
        ])->assertStatus(400);
        $this->assertEquals(10, $product->fresh()->stock);
    }
}
