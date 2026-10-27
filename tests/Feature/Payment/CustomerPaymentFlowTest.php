<?php

declare(strict_types=1);

namespace Tests\Feature\Payment;

use App\Models\Business;
use App\Models\Order;
use App\Models\Product;
use App\Models\Setting;
use App\Models\User;
use App\Services\OrderCancellationService;
use App\Services\OrderReturnService;
use App\Services\OrderService;
use App\Services\PaymentService;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class CustomerPaymentFlowTest extends TestCase
{
    use RefreshDatabase;

    private function configure(): void
    {
        foreach ([['store', 'qris_image', 'qris/store.png'], ['payment', 'qris_enabled', 'true'], ['tax', 'enabled', 'false']] as [$group, $key, $value]) {
            Setting::updateOrCreate(compact('group', 'key'), ['value' => $value, 'type' => 'string']);
        }
    }

    private function payload(Product $product, array $attributes = []): array
    {
        return array_replace([
            'customer_name' => 'Pelanggan Test', 'payment_preference' => 'qris',
            'expected_total' => 30000, 'request_id' => (string) Str::uuid(),
            'items' => [['product_id' => $product->id, 'quantity' => 2]],
        ], $attributes);
    }

    private function order(): Order
    {
        $this->configure();
        $product = Product::factory()->create(['price' => 15000, 'stock' => 10, 'is_available' => true]);

        return app(OrderService::class)->createOrder($this->payload($product), true);
    }

    private function report(Order $order, array $data = [])
    {
        return $this->postJson($this->storeUrl('/api/customer/order/'.$order->id.'/payment-review'), array_merge([
            'customer_token' => $order->customer_access_token, 'reference' => 'TX-123',
        ], $data));
    }

    private function staff(string $role = 'cashier'): User
    {
        $this->seed(RoleSeeder::class);
        $user = User::factory()->create();
        $user->assignRole($role);

        return $user;
    }

    public function test_polling_and_qr_requests_do_not_consume_checkout_capacity_and_retry_header_is_preserved(): void
    {
        Cache::flush();
        $order = $this->order();
        $product = Product::factory()->create(['price' => 15000, 'stock' => 50, 'is_available' => true]);
        for ($i = 0; $i < 5; $i++) {
            $this->withHeader('X-Customer-Token', $order->customer_access_token)->getJson($this->storeUrl('/api/customer/order/'.$order->id.'/status'))->assertOk();
        }
        for ($i = 0; $i < 3; $i++) {
            $this->postJson($this->storeUrl('/api/customer/order'), $this->payload($product))->assertCreated();
        }
        $this->postJson($this->storeUrl('/api/customer/order'), $this->payload($product))->assertStatus(429)->assertHeader('Retry-After');
        $this->withHeader('X-Customer-Token', $order->customer_access_token)->getJson($this->storeUrl('/api/customer/order/'.$order->id.'/status'))->assertOk();
    }

    public function test_payment_report_is_idempotent_unpaid_and_protects_expiry_and_customer_cancellation(): void
    {
        $order = $this->order();
        $this->report($order)->assertOk()->assertJsonPath('data.payment_status', 'unpaid')->assertJsonPath('data.payment_reference', 'TX-123');
        $version = $order->fresh()->sync_version;
        $this->report($order, ['reference' => 'CHANGED'])->assertOk()->assertJsonPath('data.payment_reference', 'TX-123');
        $this->assertSame($version, $order->fresh()->sync_version);
        $this->assertDatabaseCount('payments', 0);
        $this->postJson($this->storeUrl('/api/customer/order/'.$order->id.'/cancel'), ['customer_token' => $order->customer_access_token])->assertUnprocessable();
        $this->travel(20)->minutes();
        $this->assertFalse(app(OrderCancellationService::class)->expire($order->id));
        $this->assertFalse(Order::stale()->whereKey($order->id)->exists());
        $this->assertEquals(8, $order->items->first()->product->fresh()->stock);
    }

    public function test_token_and_business_boundaries_apply_to_payment_reports(): void
    {
        $order = $this->order();
        $this->report($order, ['customer_token' => str_repeat('x', 64)])->assertUnauthorized();
        $this->report($order, ['reference' => str_repeat('x', 101)])->assertUnprocessable();
        $business = Business::create(['name' => 'Other', 'slug' => 'other-flow']);
        $business->forceFill(['activated_at' => now()])->save();
        $this->postJson($this->storeUrl('/api/customer/order/'.$order->id.'/payment-review?shop=other-flow'), ['customer_token' => $order->customer_access_token])->assertUnauthorized();
        $this->assertNull($order->fresh()->payment_review_requested_at);
    }

    public function test_changed_total_rejects_checkout_without_order_stock_or_idempotency_side_effects(): void
    {
        $this->configure();
        $product = Product::factory()->create(['price' => 16000, 'stock' => 10, 'is_available' => true]);
        $payload = $this->payload($product);
        $this->postJson($this->storeUrl('/api/customer/order'), $payload)->assertUnprocessable()->assertJsonValidationErrors('expected_total');
        $this->assertDatabaseCount('orders', 0);
        $this->assertDatabaseCount('checkout_requests', 0);
        $this->assertEquals(10, $product->fresh()->stock);
        $payload['expected_total'] = 32000;
        $this->postJson($this->storeUrl('/api/customer/order'), $payload)->assertCreated()->assertJsonPath('data.total', 32000)->assertJsonPath('data.payment_preference', 'qris');
        $this->postJson($this->storeUrl('/api/customer/order'), $payload)->assertCreated();
        $this->assertDatabaseCount('orders', 1);
        $this->assertEquals(8, $product->fresh()->stock);
    }

    public function test_disabled_qris_is_rejected_at_checkout_instead_of_leaving_an_unpayable_preference(): void
    {
        $this->configure();
        Setting::where('group', 'payment')->where('key', 'qris_enabled')->update(['value' => 'false']);
        $product = Product::factory()->create(['price' => 15000, 'stock' => 10, 'is_available' => true]);
        $this->postJson($this->storeUrl('/api/customer/order'), $this->payload($product))->assertUnprocessable()->assertJsonValidationErrors('payment_preference');
        $this->assertDatabaseCount('orders', 0);
        $this->postJson($this->storeUrl('/api/customer/order'), $this->payload($product, ['payment_preference' => 'kasir']))->assertCreated()->assertJsonPath('data.payment_preference', 'kasir');
    }

    public function test_staff_can_resolve_a_report_then_customer_can_retry_and_staff_confirms_qris_exactly_once(): void
    {
        $order = $this->order();
        $this->report($order)->assertOk();
        $this->postJson('/api/payments/order/'.$order->id.'/reject-review', ['reason' => 'Dana belum diterima'])->assertUnauthorized();
        $cashier = $this->staff();
        $this->actingAs($cashier)->postJson('/api/payments/order/'.$order->id.'/reject-review', ['reason' => 'Dana belum diterima'])->assertOk();
        $this->assertNull($order->fresh()->payment_review_requested_at);
        $this->assertNotNull($order->fresh()->expires_at);
        $this->assertSame('Dana belum diterima', $order->fresh()->payment_review_note);
        $this->report($order)->assertOk();
        $this->actingAs($cashier)->postJson('/api/payments', ['order_id' => $order->id, 'payment_method' => 'cash', 'amount_received' => 30000])->assertUnprocessable();
        // A report already sent while QRIS was enabled remains verifiable after the setting changes.
        Setting::where('group', 'payment')->where('key', 'qris_enabled')->update(['value' => 'false']);
        $this->postJson('/api/payments', ['order_id' => $order->id, 'payment_method' => 'qris_manual', 'reference_number' => 'MERCHANT-1'])->assertCreated()->assertJsonPath('data.order.order_status', 'preparing');
        $this->assertNull($order->fresh()->payment_review_requested_at);
        $this->assertNull($order->fresh()->expires_at);
        $this->postJson('/api/payments', ['order_id' => $order->id, 'payment_method' => 'qris_manual'])->assertUnprocessable();
        $this->assertDatabaseCount('payments', 1);
    }

    public function test_pending_report_cannot_be_deleted_or_cancelled_by_owner(): void
    {
        $order = $this->order();
        $this->report($order)->assertOk();
        $this->actingAs($this->staff('owner'));
        foreach (['delete', 'cancel'] as $action) {
            try {
                if ($action === 'delete') {
                    app(OrderService::class)->deleteOrder($order->id);
                } else {
                    app(OrderService::class)->updateOrderStatus($order->id, ['order_status' => 'cancelled']);
                }
                $this->fail('A payment under review must be resolved before cancellation or deletion.');
            } catch (ValidationException) {
                $this->assertNotNull($order->fresh());
            }
        }
    }

    public function test_expired_order_rejects_report_and_exposes_cancellation_reason(): void
    {
        $order = $this->order();
        $this->travel(20)->minutes();
        $this->report($order)->assertUnprocessable();
        $this->assertTrue(app(OrderCancellationService::class)->expire($order->id));
        $this->withHeader('X-Customer-Token', $order->customer_access_token)->getJson($this->storeUrl('/api/customer/order/'.$order->id.'/status'))->assertOk()->assertJsonPath('data.cancel_reason', 'expired')->assertJsonPath('data.order_status', 'cancelled');
        $this->assertEquals(10, $order->items->first()->product->fresh()->stock);
    }

    public function test_snapshot_includes_partial_and_full_refund_ledger_without_customer_token(): void
    {
        $order = $this->order();
        $this->actingAs($this->staff('owner'));
        app(PaymentService::class)->processPayment(['order_id' => $order->id, 'payment_method' => 'qris_manual']);
        $order->update(['order_status' => 'completed']);
        $item = $order->items->first();
        $return = ['request_id' => (string) Str::uuid(), 'order_item_id' => $item->id, 'quantity' => 1, 'refund_method' => 'bank_transfer', 'refund_reference' => 'REF-1', 'restock' => false, 'reason' => 'Tidak cocok'];
        app(OrderReturnService::class)->returnItem($order->id, $return);
        $response = $this->withHeader('X-Customer-Token', $order->customer_access_token)->getJson($this->storeUrl('/api/customer/order/'.$order->id.'/status'))->assertOk()->assertJsonPath('data.refunded_amount', 15000)->assertJsonPath('data.refunds.0.quantity', 1);
        $this->assertArrayNotHasKey('customer_token', $response->json('data'));
        $this->assertNotNull($response->json('data.invoice_number'));
        $return['request_id'] = (string) Str::uuid();
        app(OrderReturnService::class)->returnItem($order->id, $return);
        $this->withHeader('X-Customer-Token', $order->customer_access_token)->getJson($this->storeUrl('/api/customer/order/'.$order->id.'/status'))->assertOk()->assertJsonPath('data.refunded_amount', 30000)->assertJsonPath('data.payment_status', 'refunded');
    }
}
