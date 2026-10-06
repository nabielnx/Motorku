<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Motorcycle;
use App\Models\MotorcyclePart;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Product;
use App\Models\Setting;
use App\Models\User;
use App\Services\CashClosingService;
use App\Services\OrderService;
use App\Services\ReportService;
use Carbon\Carbon;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class FullAuditRemediationTest extends TestCase
{
    use RefreshDatabase;

    private User $owner;

    protected function setUp(): void
    {
        parent::setUp();
        $this->assertSame('sparepart_testing', DB::connection()->getDatabaseName());
        $this->seed(RoleSeeder::class);
        $this->owner = User::factory()->create();
        $this->owner->assignRole('owner');
        config(['app.timezone' => 'Asia/Jakarta']);
        date_default_timezone_set('Asia/Jakarta');
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        date_default_timezone_set('Asia/Jakarta');
        parent::tearDown();
    }

    public function test_checkout_key_cannot_be_reused_for_a_different_cart_or_cashier(): void
    {
        $product = Product::factory()->create(['price' => 10000, 'stock' => 5]);
        $payload = ['request_id' => fake()->uuid(), 'items' => [['product_id' => $product->id, 'quantity' => 1]], 'amount_received' => 10000];
        $this->actingAs($this->owner)->postJson('/api/orders/pos-sale', $payload)->assertCreated();
        $changed = $payload;
        $changed['items'][0]['quantity'] = 2;
        $changed['amount_received'] = 20000;
        $this->postJson('/api/orders/pos-sale', $changed)->assertUnprocessable()->assertJsonValidationErrors('request_id');
        $other = User::factory()->create();
        $other->assignRole('owner');
        $this->actingAs($other)->postJson('/api/orders/pos-sale', $payload)->assertUnprocessable()->assertJsonValidationErrors('request_id');
        $this->assertDatabaseCount('orders', 1);
        $this->assertSame(4, $product->fresh()->stock);
    }

    public function test_public_checkout_retry_returns_the_same_order_and_access_token(): void
    {
        $product = Product::factory()->create(['price' => 10000, 'stock' => 5]);
        $payload = ['request_id' => fake()->uuid(), 'customer_name' => 'Retry customer', 'items' => [['product_id' => $product->id, 'quantity' => 1]]];
        $first = $this->postJson('/api/customer/order', $payload)->assertCreated();
        $this->postJson('/api/customer/order', $payload)->assertCreated()
            ->assertJsonPath('data.id', $first->json('data.id'))
            ->assertJsonPath('data.customer_token', $first->json('data.customer_token'));
        $this->assertDatabaseCount('orders', 1);
        $this->assertDatabaseCount('checkout_requests', 1);
        $this->assertSame(4, $product->fresh()->stock);
    }

    public function test_failed_checkout_rolls_back_the_request_key_stock_and_order(): void
    {
        $product = Product::factory()->create(['price' => 10000, 'stock' => 5]);
        $payload = ['request_id' => fake()->uuid(), 'items' => [['product_id' => $product->id, 'quantity' => 1]], 'amount_received' => 5000];
        $this->actingAs($this->owner)->postJson('/api/orders/pos-sale', $payload)->assertUnprocessable();
        $this->assertDatabaseCount('orders', 0);
        $this->assertDatabaseCount('checkout_requests', 0);
        $this->assertSame(5, $product->fresh()->stock);
        $payload['amount_received'] = 10000;
        $this->postJson('/api/orders/pos-sale', $payload)->assertCreated();
        $this->assertDatabaseCount('checkout_requests', 1);
    }

    public function test_duplicate_product_lines_check_combined_stock(): void
    {
        $product = Product::factory()->create(['price' => 10000, 'stock' => 2]);
        $this->postJson('/api/customer/order', [
            'customer_name' => 'Stock check',
            'items' => [
                ['product_id' => $product->id, 'quantity' => 2, 'notes' => 'First package'],
                ['product_id' => $product->id, 'quantity' => 1, 'notes' => 'Second package'],
            ],
        ])->assertUnprocessable()->assertJsonValidationErrors('items');
        $this->assertDatabaseCount('orders', 0);
        $this->assertSame(2, $product->fresh()->stock);
    }

    public function test_failure_of_another_attempt_does_not_demote_a_paid_order(): void
    {
        $product = Product::factory()->create(['price' => 10000, 'stock' => 5]);
        $order = $this->publicOrder($product);
        $this->actingAs($this->owner)->postJson('/api/payments', ['order_id' => $order->id, 'payment_method' => 'cash', 'amount_received' => 10000])->assertCreated();
        $lateAttempt = Payment::factory()->create(['order_id' => $order->id, 'status' => 'pending', 'paid_at' => null]);
        $this->patchJson("/api/payments/{$lateAttempt->id}/status", ['status' => 'failed'])->assertOk();
        $this->assertSame('paid', $order->fresh()->payment_status->value);
        $this->assertSame(1, $order->payments()->where('status', 'paid')->count());
    }

    public function test_empty_qris_image_cannot_confirm_payment_through_either_endpoint(): void
    {
        Setting::create(['group' => 'store', 'key' => 'qris_image', 'value' => '  ']);
        $product = Product::factory()->create(['price' => 10000, 'stock' => 5]);
        $order = $this->publicOrder($product);
        $payment = Payment::factory()->create([
            'order_id' => $order->id, 'status' => 'pending', 'payment_method' => 'qris_manual',
            'amount' => 10000, 'amount_received' => 10000, 'paid_at' => null,
        ]);
        $this->actingAs($this->owner)->postJson('/api/payments', ['order_id' => $order->id, 'payment_method' => 'qris_manual'])
            ->assertUnprocessable()->assertJsonValidationErrors('payment_method');
        $this->patchJson('/api/payments/'.$payment->id.'/status', ['status' => 'paid'])
            ->assertUnprocessable()->assertJsonValidationErrors('payment_method');
        $this->assertSame('unpaid', $order->fresh()->payment_status->value);
        $this->assertSame('pending', $payment->fresh()->status);
    }

    public function test_bulk_and_individual_settings_have_the_same_typed_validation(): void
    {
        $tax = Setting::create(['group' => 'tax', 'key' => 'percentage', 'value' => '10']);
        $this->actingAs($this->owner)->putJson('/api/settings/'.$tax->id, ['value' => '-1'])->assertUnprocessable();
        $this->postJson('/api/settings', ['settings' => [
            ['group' => 'store', 'key' => 'name', 'value' => 'Should not be saved'],
            ['group' => 'tax', 'key' => 'percentage', 'value' => '101'],
        ]])->assertUnprocessable();
        $this->assertDatabaseMissing('settings', ['group' => 'store', 'key' => 'name']);
        $this->putJson('/api/settings/'.$tax->id, ['value' => '12.5'])->assertOk();
        $this->assertSame('12.5', $tax->fresh()->value);
    }

    public function test_settings_reject_unknown_keys_image_paths_and_malformed_values(): void
    {
        $this->actingAs($this->owner);
        foreach ([
            ['group' => 'unknown', 'key' => 'flag', 'value' => 'true'],
            ['group' => 'store', 'key' => 'logo', 'value' => 'missing-file.webp'],
            ['group' => ['tax'], 'key' => 'percentage', 'value' => '10'],
            ['group' => 'store', 'key' => 'name', 'value' => ['invalid']],
        ] as $item) {
            $this->postJson('/api/settings', ['settings' => [$item]])->assertUnprocessable();
        }
        $this->assertDatabaseCount('settings', 0);
    }

    public function test_children_keep_catalog_group_on_create_and_update(): void
    {
        $created = $this->actingAs($this->owner)->postJson('/api/categories', [
            'name' => 'Electronics', 'catalog_group' => 'electronics', 'sub_categories' => [['name' => 'Fans']],
        ])->assertCreated();
        $parent = Category::where('name', 'Electronics')->firstOrFail();
        $child = $parent->children()->firstOrFail();
        $this->assertSame('electronics', $child->catalog_group);
        $this->putJson('/api/categories/'.$parent->id, [
            'name' => 'Hardware', 'catalog_group' => 'hardware', 'sub_categories' => [['id' => $child->id, 'name' => 'Fans']],
        ])->assertOk();
        $this->assertSame('hardware', $child->fresh()->catalog_group);
        $this->assertSame(1, $parent->children()->count());
    }

    public function test_disabling_ordering_does_not_block_existing_customer_history(): void
    {
        $product = Product::factory()->create(['price' => 10000, 'stock' => 5]);
        $order = $this->publicOrder($product);
        Setting::create(['group' => 'qr_order', 'key' => 'enabled', 'value' => 'false']);
        $this->get('/')->assertOk()->assertInertia(fn ($page) => $page->component('Order/Menu')->where('settings', fn ($settings) => $settings['qr_order.enabled'] === 'false'));
        $this->getJson('/api/customer/order/'.$order->id.'/status?customer_token='.$order->customer_access_token)->assertOk();
        $this->assertSame('pending', $order->fresh()->order_status->value);
    }

    public function test_disabling_promo_banner_hides_uploaded_banner(): void
    {
        Setting::create(['group' => 'store', 'key' => 'promo_banner_1', 'value' => 'banners/example.webp']);
        Setting::create(['group' => 'promo_banner', 'key' => 'enabled', 'value' => 'false']);
        $this->get('/')->assertOk()->assertInertia(fn ($page) => $page->component('Order/Menu')->where('promoBanners.1', null));
    }

    private function publicOrder(Product $product): Order
    {
        return app(OrderService::class)->createOrder([
            'customer_name' => 'Audit customer',
            'items' => [['product_id' => $product->id, 'quantity' => 1]],
        ], true);
    }

    public function test_same_pos_submission_returns_one_paid_sale(): void
    {
        $product = Product::factory()->create(['price' => 10000, 'stock' => 5]);
        $payload = ['request_id' => fake()->uuid(), 'items' => [['product_id' => $product->id, 'quantity' => 1]], 'amount_received' => 10000];
        $firstSale = $this->actingAs($this->owner)->postJson('/api/orders/pos-sale', $payload)->assertCreated();
        $this->postJson('/api/orders/pos-sale', $payload)->assertCreated();
        $this->assertDatabaseCount('orders', 1);
        $this->assertDatabaseCount('payments', 1);
        $this->assertSame(4, $product->fresh()->stock);
    }

    public function test_return_is_blocked_until_order_is_completed(): void
    {
        $product = Product::factory()->create(['price' => 10000, 'stock' => 5]);
        $order = $this->publicOrder($product);
        $paymentResponse = $this->actingAs($this->owner)->postJson('/api/payments', ['order_id' => $order->id, 'payment_method' => 'cash', 'amount_received' => 10000])->assertCreated();
        $this->assertSame('preparing', $order->fresh()->order_status->value);
        $this->postJson("/api/orders/{$order->id}/returns", [
            'request_id' => fake()->uuid(), 'order_item_id' => $order->items->first()->id,
            'quantity' => 1, 'restock' => true, 'refund_confirmed' => true, 'reason' => 'Full refund',
        ])->assertUnprocessable();
        $this->assertDatabaseCount('order_returns', 0);
        $this->assertSame('paid', $order->fresh()->payment_status->value);
        $this->assertSame(1, app(OrderService::class)->countActiveOrders());
        $this->patchJson("/api/orders/{$order->id}/status", ['status' => 'ready'])->assertOk();
    }

    public function test_cancelled_order_cannot_be_paid_through_legacy_endpoint(): void
    {
        $product = Product::factory()->create(['price' => 10000, 'stock' => 5]);
        $order = $this->publicOrder($product);
        $payment = Payment::factory()->create(['order_id' => $order->id, 'status' => 'pending', 'payment_method' => 'cash', 'amount' => 10000, 'paid_at' => null]);
        $this->actingAs($this->owner)->patchJson("/api/orders/{$order->id}/status", ['status' => 'cancelled'])->assertOk();
        $this->patchJson("/api/payments/{$payment->id}/status", ['status' => 'paid'])->assertUnprocessable();
        $this->assertSame('cancelled', $order->fresh()->order_status->value);
        $this->assertSame('unpaid', $order->fresh()->payment_status->value);
        $this->assertSame('cancelled', $payment->fresh()->status);
        $this->assertSame(5, $product->fresh()->stock);
        $this->assertEquals(0, app(CashClosingService::class)->summary(now()->toDateString())['cash_sales']);
        $this->assertEquals(0, app(ReportService::class)->netRevenue(now()->startOfDay(), now()->endOfDay()));
    }

    public function test_legacy_payment_respects_cash_closing(): void
    {
        $product = Product::factory()->create(['price' => 10000, 'stock' => 5]);
        $order = $this->publicOrder($product);
        $payment = Payment::factory()->create(['order_id' => $order->id, 'status' => 'pending', 'payment_method' => 'cash', 'amount' => 10000, 'paid_at' => null]);
        $this->actingAs($this->owner)->postJson('/api/reports/cash/close', ['date' => now()->toDateString(), 'opening_cash' => 0, 'cash_out' => 0, 'actual_cash' => 0])->assertCreated();
        $this->patchJson("/api/payments/{$payment->id}/status", ['status' => 'paid'])->assertUnprocessable();
        $summary = app(CashClosingService::class)->summary(now()->toDateString());
        $this->assertEquals(0, $summary['cash_sales']);
        $this->assertEquals(0, $summary['closing']->cash_sales);
    }

    public function test_superseded_payment_cannot_demote_paid_order(): void
    {
        $product = Product::factory()->create(['price' => 10000, 'stock' => 5]);
        $order = $this->publicOrder($product);
        $legacy = Payment::factory()->create(['order_id' => $order->id, 'status' => 'pending', 'payment_channel' => 'doku_checkout', 'paid_at' => null]);
        $this->actingAs($this->owner)->postJson('/api/payments', ['order_id' => $order->id, 'payment_method' => 'cash', 'amount_received' => 10000])->assertCreated();
        $this->patchJson("/api/payments/{$legacy->id}/status", ['status' => 'failed'])->assertUnprocessable();
        $this->assertSame('paid', $order->fresh()->payment_status->value);
        $this->assertSame(1, $order->payments()->where('status', 'paid')->count());
    }

    public function test_pos_and_backend_round_tax_to_whole_rupiah(): void
    {
        Setting::create(['group' => 'tax', 'key' => 'enabled', 'value' => 'true']);
        Setting::create(['group' => 'tax', 'key' => 'percentage', 'value' => '10']);
        $product = Product::factory()->create(['price' => 10001, 'stock' => 5]);
        $this->actingAs($this->owner)->postJson('/api/orders/pos-sale', ['items' => [['product_id' => $product->id, 'quantity' => 1]], 'amount_received' => 11001])->assertCreated()->assertJsonPath('data.order.tax_amount', 1000);
        $this->assertDatabaseCount('orders', 1);
        $this->assertSame(4, $product->fresh()->stock);
    }

    public function test_disabled_qr_catalog_rejects_new_orders(): void
    {
        Setting::create(['group' => 'qr_order', 'key' => 'enabled', 'value' => 'false']);
        $product = Product::factory()->create(['price' => 10000, 'stock' => 5]);
        $this->postJson('/api/customer/order', ['customer_name' => 'Audit', 'items' => [['product_id' => $product->id, 'quantity' => 1]]])->assertForbidden();
        $this->assertDatabaseCount('orders', 0);
    }

    public function test_public_order_and_payment_use_store_timezone(): void
    {
        Setting::create(['group' => 'system', 'key' => 'timezone', 'value' => 'Asia/Jayapura']);
        Carbon::setTestNow(Carbon::parse('2026-10-06 16:30:00', 'UTC'));
        $product = Product::factory()->create(['price' => 10000, 'stock' => 5]);
        $response = $this->postJson('/api/customer/order', ['customer_name' => 'Audit', 'items' => [['product_id' => $product->id, 'quantity' => 1]]])->assertCreated();
        $orderId = $response->json('data.id');
        $this->assertStringContainsString('ORD-20261007-', $response->json('data.order_number'));
        $this->actingAs($this->owner)->postJson('/api/payments', ['order_id' => $orderId, 'payment_method' => 'cash', 'amount_received' => 10000])->assertCreated();
        $this->assertSame('Asia/Jayapura', config('app.timezone'));
        $this->assertSame('2026-10-07 01:30:00', DB::table('payments')->where('order_id', $orderId)->value('paid_at'));
        $this->assertSame('2026-10-07 01:30:00', DB::table('orders')->where('id', $orderId)->value('created_at'));
    }

    public function test_parent_category_cannot_orphan_children(): void
    {
        $root = Category::factory()->create(['catalog_group' => 'electronics']);
        $child = Category::factory()->create(['parent_id' => $root->id, 'catalog_group' => 'automotive']);
        $product = Product::factory()->create(['category_id' => $child->id]);
        $this->assertSame(1, Product::inCatalogGroup('electronics')->count());
        $this->actingAs($this->owner)->deleteJson('/api/categories/'.$root->id)->assertUnprocessable();
        $this->assertSame(1, Product::inCatalogGroup('electronics')->count());
        $this->assertSame(0, Product::inCatalogGroup('automotive')->whereKey($product->id)->count());
    }

    public function test_order_resource_contains_receipt_payment_amounts(): void
    {
        $product = Product::factory()->create(['price' => 10000, 'stock' => 5]);
        $sale = $this->actingAs($this->owner)->postJson('/api/orders/pos-sale', ['items' => [['product_id' => $product->id, 'quantity' => 1]], 'amount_received' => 20000])->assertCreated();
        $this->getJson('/api/orders/'.$sale->json('data.order.id'))->assertOk()->assertJsonPath('data.payments.0.amount_received', 20000)->assertJsonPath('data.payments.0.change_amount', 10000);
    }

    public function test_bad_report_date_returns_validation_error(): void
    {
        $this->actingAs($this->owner)->getJson('/api/reports?start_date=not-a-date&end_date=2026-10-06')->assertUnprocessable();
    }

    public function test_renamed_category_invalidates_fitment_cache(): void
    {
        $category = Category::factory()->create(['name' => 'Before rename']);
        $product = Product::factory()->create(['category_id' => $category->id]);
        $motorcycle = Motorcycle::create([
            'brand' => 'Honda', 'model' => 'Audit', 'slug' => 'honda-audit',
            'year_start' => 2020, 'engine_cc' => 110, 'engine_type' => 'matic',
        ]);
        MotorcyclePart::create(['motorcycle_id' => $motorcycle->id, 'product_id' => $product->id, 'part_category' => 'oli_mesin']);
        $this->getJson('/api/motor-saya/'.$motorcycle->id.'/parts')->assertOk()->assertJsonPath('parts.0.items.0.category_name', 'Before rename');
        $this->actingAs($this->owner)->putJson('/api/categories/'.$category->id, ['name' => 'After rename'])->assertOk();
        $this->getJson('/api/motor-saya/'.$motorcycle->id.'/parts')->assertOk()->assertJsonPath('parts.0.items.0.category_name', 'After rename');
        $this->assertSame('After rename', $category->fresh()->name);
    }

    public function test_duplicate_subcategory_names_leave_no_partial_category(): void
    {
        $this->actingAs($this->owner)->postJson('/api/categories', [
            'name' => 'Audit parent', 'catalog_group' => 'electronics',
            'sub_categories' => [['name' => 'Duplicate child'], ['name' => 'Duplicate child']],
        ])->assertUnprocessable();
        $this->assertDatabaseMissing('categories', ['name' => 'Audit parent']);
        $this->assertDatabaseMissing('categories', ['name' => 'Duplicate child']);
        $this->assertDatabaseCount('categories', 0);
    }
}
