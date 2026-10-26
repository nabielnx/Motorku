<?php

declare(strict_types=1);

namespace Tests\Feature\Payment;

use App\Models\Business;
use App\Models\Order;
use App\Models\Product;
use App\Models\Setting;
use App\Services\BusinessContext;
use App\Services\CacheService;
use App\Services\QrisPayloadService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;
use Tests\Unit\QrisPayloadServiceTest;

class CustomerQrisTest extends TestCase
{
    use RefreshDatabase;

    private function setting(string $group, string $key, ?string $value): void
    {
        Setting::updateOrCreate(['group' => $group, 'key' => $key], ['value' => $value, 'type' => 'string']);
        CacheService::flushSettings();
    }

    private function configure(): void
    {
        $this->setting('store', 'qris_image', 'qris/store.png');
        $this->setting('store', 'qris_payload', QrisPayloadServiceTest::sample());
        $this->setting('payment', 'qris_enabled', 'true');
    }

    private function order(array $attributes = []): Order
    {
        return Order::factory()->create(array_replace([
            'cashier_id' => null, 'customer_access_token' => Str::random(64),
            'total' => 33300, 'expires_at' => now()->addMinutes(15),
        ], $attributes));
    }

    private function qr(Order $order, ?string $token = null, string $query = '')
    {
        return $this->postJson('/api/customer/order/'.$order->id.'/qris'.$query, [
            'customer_token' => $token ?? $order->customer_access_token,
            'amount' => 1, 'total' => 1, 'payment_status' => 'paid',
        ]);
    }

    public function test_customer_qr_uses_saved_order_total_and_never_marks_payment_paid(): void
    {
        $this->configure();
        $this->setting('tax', 'enabled', 'true');
        $this->setting('tax', 'percentage', '11');
        $product = Product::factory()->create(['price' => 15000, 'stock' => 5, 'is_available' => true]);
        $created = $this->postJson('/api/customer/order', [
            'customer_name' => 'Pelanggan QRIS',
            'items' => [['product_id' => $product->id, 'quantity' => 2]],
            'notes' => 'Pre-order Web | Pembayaran: QRIS',
        ])->assertCreated();
        $order = Order::findOrFail($created->json('data.id'));
        $product->update(['price' => 20000]);
        $response = $this->qr($order)->assertOk()->assertJsonPath('data.amount', 33300)
            ->assertJsonPath('data.order_id', $order->id)->assertJsonPath('data.merchant.name', 'TOKO UJI')
            ->assertHeader('Cache-Control', 'no-store, private');
        $this->assertSame((new QrisPayloadService)->withAmount(QrisPayloadServiceTest::sample(), 33300), $response->json('data.payload'));
        $this->assertSame('unpaid', $order->fresh()->payment_status->value);
        $this->assertEquals(3, $product->fresh()->stock);
        $this->assertDatabaseCount('payments', 0);
        $this->assertArrayNotHasKey('customer_token', $response->json('data'));
        $this->qr($order)->assertOk();
        $this->assertDatabaseCount('orders', 1);
        $this->assertDatabaseCount('payments', 0);
    }

    public function test_missing_wrong_or_foreign_store_tokens_cannot_access_a_qr(): void
    {
        $this->configure();
        $order = $this->order();
        $this->postJson('/api/customer/order/'.$order->id.'/qris', [])->assertUnprocessable()->assertJsonValidationErrors('customer_token');
        $this->qr($order, str_repeat('x', 64))->assertUnauthorized();
        $business = Business::create(['name' => 'Toko Lain', 'slug' => 'toko-lain']);
        $business->forceFill(['activated_at' => now()])->save();
        $foreign = app(BusinessContext::class)->run($business->id, function (): Order {
            $this->configure();

            return $this->order(['total' => 25000]);
        });
        $this->qr($foreign)->assertUnauthorized();
        $this->qr($foreign, null, '?shop=toko-lain')->assertOk()->assertJsonPath('data.amount', 25000);
        $this->qr($order, null, '?shop=toko-lain')->assertUnauthorized();
    }

    public function test_paid_partial_refunded_cancelled_completed_and_expired_orders_are_rejected(): void
    {
        $this->configure();
        foreach ([
            ['payment_status' => 'paid'], ['payment_status' => 'partial'], ['payment_status' => 'refunded'],
            ['order_status' => 'cancelled'], ['order_status' => 'completed'], ['expires_at' => now()->subSecond()],
        ] as $attributes) {
            $this->qr($this->order($attributes))->assertUnprocessable()->assertJsonValidationErrors('order');
        }
        $this->assertDatabaseCount('payments', 0);
    }

    public function test_disabled_or_missing_qris_and_unsupported_amounts_are_rejected(): void
    {
        $this->configure();
        $order = $this->order();
        $this->setting('payment', 'qris_enabled', 'false');
        $this->qr($order)->assertUnprocessable()->assertJsonValidationErrors('qris');
        $this->setting('payment', 'qris_enabled', 'true');
        $this->setting('store', 'qris_image', null);
        $this->qr($order)->assertUnprocessable()->assertJsonValidationErrors('qris');
        $this->configure();
        foreach ([0, 10000001] as $amount) {
            $this->qr($this->order(['total' => $amount]))->assertUnprocessable()->assertJsonValidationErrors('amount');
        }
    }

    public function test_legacy_static_qris_returns_the_configured_image_and_server_total(): void
    {
        $this->configure();
        $this->setting('store', 'qris_payload', '');
        $this->qr($this->order())->assertOk()->assertJsonPath('data.payload', null)
            ->assertJsonPath('data.url', '/storage/qris/store.png')->assertJsonPath('data.amount', 33300);
    }

    public function test_checkout_qris_option_follows_store_settings(): void
    {
        $this->get('/payment')->assertInertia(fn ($page) => $page->where('app_settings.customer_qris_enabled', false));
        $this->configure();
        $this->get('/payment')->assertInertia(fn ($page) => $page->where('app_settings.customer_qris_enabled', true));
        $this->setting('payment', 'qris_enabled', 'false');
        $this->get('/payment')->assertInertia(fn ($page) => $page->where('app_settings.customer_qris_enabled', false));
    }
}
