<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Business;
use App\Models\Category;
use App\Models\Order;
use App\Models\Product;
use App\Models\Setting;
use App\Models\User;
use App\Services\CustomerOrderService;
use App\Services\OrderCancellationService;
use Carbon\Carbon;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

final class AuditHardeningTest extends TestCase
{
    use RefreshDatabase;

    private User $owner;

    protected function setUp(): void
    {
        parent::setUp();
        Notification::fake();
        $this->seed(RoleSeeder::class);
        $this->owner = User::factory()->create();
        $this->owner->assignRole('owner');
    }

    public function test_stale_edit_is_rejected_and_missing_version_cannot_bypass_conflict_check(): void
    {
        $product = Product::factory()->create(['price' => 1000]);
        $this->actingAs($this->owner)->putJson('/api/products/'.$product->id, ['price' => 2000, 'sync_version' => 1])->assertOk();
        $this->putJson('/api/products/'.$product->id, ['name' => 'Stale name', 'price' => 1000, 'sync_version' => 1])->assertConflict();
        $this->putJson('/api/products/'.$product->id, ['price' => 1000])->assertUnprocessable()->assertJsonValidationErrors('sync_version');
        $this->assertEquals(2000, (float) $product->fresh()->price);
        $this->assertSame(2, (int) $product->fresh()->sync_version);
    }

    public function test_fractional_or_overflow_initial_stock_is_rejected(): void
    {
        $category = Category::factory()->create();
        $this->actingAs($this->owner);
        foreach ([1.9, 100000000] as $stock) {
            $this->postJson('/api/products', ['category_id' => $category->id, 'sku' => 'AUDIT-STOCK', 'name' => 'Stock test', 'price' => 1000, 'stock' => $stock])
                ->assertUnprocessable()->assertJsonValidationErrors('stock');
        }
        $this->assertDatabaseCount('products', 0);
    }

    public function test_cash_sale_requires_and_honours_expected_total_before_any_stock_mutation(): void
    {
        $product = Product::factory()->create(['price' => 15000, 'stock' => 10]);
        $payload = ['items' => [['product_id' => $product->id, 'quantity' => 1]], 'amount_received' => 20000];
        $this->actingAs($this->owner)->postJson('/api/orders/pos-sale', $payload)->assertUnprocessable()->assertJsonValidationErrors('expected_total');
        $this->postJson('/api/orders/pos-sale', [...$payload, 'expected_total' => 10000])->assertUnprocessable()->assertJsonValidationErrors('expected_total');
        $this->assertDatabaseCount('orders', 0);
        $this->assertSame(10, $product->fresh()->stock);
        $this->postJson('/api/orders/pos-sale', [...$payload, 'expected_total' => 15000])->assertCreated()->assertJsonPath('data.payment.change_amount', '5000.00');
    }

    public function test_bad_customer_name_is_a_validation_error_instead_of_a_server_error(): void
    {
        $product = Product::factory()->create();
        $this->postJson('/api/customer/order', ['customer_name' => ['invalid'], 'items' => [['product_id' => $product->id, 'quantity' => 1]]])
            ->assertUnprocessable()->assertJsonValidationErrors('customer_name');
        $this->assertDatabaseCount('orders', 0);
    }

    public function test_aggregate_money_overflow_is_rejected_before_writing_the_order(): void
    {
        $product = Product::factory()->create(['price' => 6000000000000, 'stock' => 10]);
        $this->actingAs($this->owner)->postJson('/api/orders/pos-sale', [
            'items' => [['product_id' => $product->id, 'quantity' => 2]], 'expected_total' => 1000, 'amount_received' => 1000,
        ])->assertUnprocessable()->assertJsonValidationErrors('items');
        $this->assertDatabaseCount('orders', 0);
        $this->assertSame(10, $product->fresh()->stock);
    }

    public function test_report_presets_are_resolved_server_side_and_large_custom_ranges_are_rejected(): void
    {
        $this->travelTo(Carbon::parse('2026-10-25 12:00:00'));
        $this->actingAs($this->owner)->get('/reports?period=today')->assertOk()->assertInertia(fn ($page) => $page
            ->where('filters.start_date', '2026-10-25')->where('filters.end_date', '2026-10-25'));
        $this->getJson('/api/reports?start_date=1900-01-01&end_date=2100-01-01')->assertUnprocessable()->assertJsonValidationErrors('end_date');
        $this->travelBack();
    }

    public function test_list_endpoints_reject_unbounded_page_sizes(): void
    {
        $this->actingAs($this->owner);
        foreach (['products', 'orders', 'payments', 'inventory', 'users'] as $endpoint) {
            foreach ([0, -1, 101] as $size) {
                $this->getJson('/api/'.$endpoint.'?per_page='.$size)->assertUnprocessable()->assertJsonValidationErrors('per_page');
            }
        }
    }

    public function test_review_expires_after_24_hours_returns_stock_once_and_cannot_be_paid(): void
    {
        $product = Product::factory()->create(['price' => 1000, 'stock' => 5]);
        $created = $this->postJson('/api/customer/order', ['customer_name' => 'Review expiry', 'items' => [['product_id' => $product->id, 'quantity' => 1]]])->assertCreated()->json('data');
        Setting::updateOrCreate(['group' => 'payment', 'key' => 'qris_enabled'], ['value' => 'true']);
        Setting::updateOrCreate(['group' => 'store', 'key' => 'qris_image'], ['value' => 'qris/test.webp']);
        app(CustomerOrderService::class)->reportPayment($created['id'], $created['customer_token'], 'claim');
        $this->travel(23)->hours();
        $this->assertFalse(app(OrderCancellationService::class)->expire($created['id']));
        $this->travel(2)->hours();
        $this->assertTrue(app(OrderCancellationService::class)->expire($created['id']));
        $this->assertFalse(app(OrderCancellationService::class)->expire($created['id']));
        $this->assertSame(5, $product->fresh()->stock);
        $this->assertSame('payment_review_expired', Order::findOrFail($created['id'])->cancel_reason);
        $this->actingAs($this->owner)->postJson('/api/payments', ['order_id' => $created['id'], 'payment_method' => 'qris_manual'])->assertUnprocessable();
        $this->assertDatabaseCount('payments', 0);
        $this->travelBack();
    }

    public function test_database_cache_pruning_preserves_live_values_and_can_be_dry_run(): void
    {
        config(['cache.default' => 'database']);
        $cache = Cache::store('database');
        $cache->put('audit-expired', 'old', 1);
        $cache->put('audit-live', 'new', 3600);
        $this->travel(3)->seconds();
        $this->artisan('cache:prune-expired --dry-run')->assertSuccessful();
        $this->assertTrue(DB::table('cache')->where('key', 'like', '%audit-expired')->exists());
        $this->artisan('cache:prune-expired')->assertSuccessful();
        $this->assertFalse(DB::table('cache')->where('key', 'like', '%audit-expired')->exists());
        $this->assertSame('new', $cache->get('audit-live'));
        $this->travelBack();
    }

    public function test_manifest_keeps_the_selected_store_and_unknown_stores_fail_closed(): void
    {
        $business = Business::create(['name' => 'Manifest Store', 'slug' => 'manifest-store']);
        $business->forceFill(['activated_at' => now()])->save();
        $this->getJson('/pwa/manifest?shop=manifest-store')->assertOk()->assertJsonPath('start_url', '/s/manifest-store')->assertJsonPath('id', '/s/manifest-store');
        $this->getJson('/pwa/manifest?shop=unknown-store')->assertNotFound();
    }
}
