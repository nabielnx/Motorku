<?php

declare(strict_types=1);

namespace Tests\Feature\Payment;

use App\Models\Order;
use App\Models\Payment;
use App\Models\Product;
use App\Models\Setting;
use App\Models\User;
use App\Services\PaymentService;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class CashAvailabilityTest extends TestCase
{
    use RefreshDatabase;

    private User $owner;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleSeeder::class);
        $this->owner = User::factory()->create();
        $this->owner->assignRole('owner');
    }

    public function test_disabled_cash_pos_sale_rolls_back_order_stock_and_payment(): void
    {
        Setting::create(['group' => 'payment', 'key' => 'cash_enabled', 'value' => 'false']);
        $product = Product::factory()->create(['stock' => 5, 'price' => 10000]);

        $this->actingAs($this->owner)->postJson('/api/orders/pos-sale', [
            'items' => [['product_id' => $product->id, 'quantity' => 1]],
            'payment_method' => 'cash', 'amount_received' => 10000,
        ])->assertUnprocessable()->assertJsonValidationErrors('payment_method');

        $this->assertEquals(5, $product->fresh()->stock);
        $this->assertDatabaseCount('orders', 0);
        $this->assertDatabaseCount('payments', 0);
        $this->assertDatabaseCount('inventory_logs', 0);
    }

    public function test_disabled_cash_cannot_pay_an_existing_order(): void
    {
        Setting::create(['group' => 'payment', 'key' => 'cash_enabled', 'value' => 'false']);
        $order = Order::factory()->create(['total' => 10000, 'payment_status' => 'unpaid']);

        $this->actingAs($this->owner)->postJson('/api/payments', [
            'order_id' => $order->id, 'payment_method' => 'cash', 'amount_received' => 10000,
        ])->assertUnprocessable()->assertJsonValidationErrors('payment_method');

        $this->assertEquals('unpaid', $order->fresh()->payment_status->value);
        $this->assertDatabaseCount('payments', 0);
    }

    public function test_pending_cash_cannot_be_finalized_after_cash_is_disabled(): void
    {
        $order = Order::factory()->create(['total' => 10000, 'payment_status' => 'unpaid']);
        $payment = Payment::factory()->create([
            'order_id' => $order->id, 'payment_method' => 'cash', 'status' => 'pending',
            'amount' => 10000, 'amount_received' => 10000, 'paid_at' => null,
        ]);
        Setting::create(['group' => 'payment', 'key' => 'cash_enabled', 'value' => 'false']);
        $this->actingAs($this->owner);

        try {
            app(PaymentService::class)->updatePaymentStatus($payment->id, 'paid');
            $this->fail('Disabled cash must not finalize a pending payment.');
        } catch (ValidationException $error) {
            $this->assertArrayHasKey('payment_method', $error->errors());
        }

        $this->assertEquals('pending', $payment->fresh()->status);
        $this->assertNull($payment->fresh()->paid_at);
        $this->assertEquals('unpaid', $order->fresh()->payment_status->value);
    }

    public function test_missing_cash_setting_preserves_existing_cash_checkout(): void
    {
        $product = Product::factory()->create(['stock' => 5, 'price' => 10000]);
        $this->actingAs($this->owner)->postJson('/api/orders/pos-sale', [
            'items' => [['product_id' => $product->id, 'quantity' => 1]], 'amount_received' => 10000,
        ])->assertCreated();
        $this->assertEquals(4, $product->fresh()->stock);
    }

    public function test_shared_cash_setting_is_available_after_runtime_settings_warm_the_cache(): void
    {
        Setting::create(['group' => 'payment', 'key' => 'cash_enabled', 'value' => 'false']);
        $this->actingAs($this->owner)->get('/orders')->assertOk()
            ->assertInertia(fn ($page) => $page->where('app_settings.cash_enabled', false));
    }
}
