<?php

declare(strict_types=1);

namespace Tests\Feature\Setting;

use App\Models\CashClosing;
use App\Models\CustomerAccount;
use App\Models\CustomerProfile;
use App\Models\InventoryLog;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderReturn;
use App\Models\Payment;
use App\Models\Product;
use App\Models\Setting;
use App\Models\Supplier;
use App\Models\User;
use App\Notifications\StoreActivity;
use App\Services\BusinessContext;
use App\Services\BusinessOnboardingService;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

final class TransactionResetTest extends TestCase
{
    use RefreshDatabase;

    private User $owner;

    private Product $product;

    private User $otherOwner;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleSeeder::class);

        $this->owner = User::factory()->create();
        $this->owner->assignRole('owner');
        $this->product = Product::factory()->create(['stock' => 23, 'price' => 45000]);
        Supplier::create(['name' => 'Supplier yang dipertahankan']);
        $this->otherOwner = app(BusinessOnboardingService::class)->register([
            'name' => 'Owner Usaha Lain',
            'email' => 'owner-reset-other@example.test',
            'business_name' => 'Usaha Lain',
            'business_slug' => 'usaha-lain-reset',
            'password' => 'Strong@1234',
        ], ['id' => 'owner-reset-other-google', 'email' => 'owner-reset-other@example.test', 'trusted_email' => true]);
    }

    public function test_owner_can_reset_only_its_operational_history_with_current_password(): void
    {
        $customer = CustomerAccount::create(['name' => 'Pelanggan', 'email' => 'retained@example.test', 'password' => 'Strong@1234']);
        $profile = CustomerProfile::create(['customer_account_id' => $customer->id, 'name' => 'Pelanggan Toko']);
        $this->createTransactionHistory($this->owner, $this->product);
        $otherOrder = app(BusinessContext::class)->run($this->otherOwner->business_id, fn () => Order::factory()->create([
            'cashier_id' => $this->otherOwner->id,
            'order_number' => 'ORD-20261025-9001',
        ]));

        $response = $this->actingAs($this->owner)->postJson('/api/settings/reset-transactions', [
            'owner_password' => 'password',
        ]);

        $response->assertOk()
            ->assertJsonPath('message', 'Data transaksi usaha berhasil direset secara permanen.')
            ->assertJsonPath('deleted.orders', 1)
            ->assertJsonPath('deleted.payments', 1)
            ->assertJsonPath('deleted.order_returns', 1);

        $this->assertSame(0, Order::count());
        $this->assertSame(0, OrderItem::count());
        $this->assertSame(0, Payment::count());
        $this->assertSame(0, OrderReturn::count());
        $this->assertSame(0, InventoryLog::count());
        $this->assertSame(0, CashClosing::count());
        $this->assertSame(0, DB::table('checkout_requests')->where('business_id', $this->owner->business_id)->count());
        $this->assertSame(0, DB::table('document_sequences')->where('business_id', $this->owner->business_id)->count());
        $this->assertSame(0, DB::table('cash_day_locks')->where('business_id', $this->owner->business_id)->count());
        $this->assertSame(0, DatabaseNotification::where('notifiable_id', $this->owner->id)->count());

        $this->assertSame(23, $this->product->fresh()->stock);
        $this->assertSame('45000.00', $this->product->fresh()->price);
        $this->assertSame(1, Supplier::count());
        $this->assertNotNull($this->owner->fresh());
        $this->assertNotNull($customer->fresh());
        $this->assertNotNull($profile->fresh());
        $this->assertDatabaseHas('orders', ['id' => $otherOrder->id, 'business_id' => $this->otherOwner->business_id]);
    }

    public function test_reset_rejects_an_incorrect_owner_password_without_deleting_data(): void
    {
        $order = $this->createTransactionHistory($this->owner, $this->product);

        $this->actingAs($this->owner)->postJson('/api/settings/reset-transactions', [
            'owner_password' => 'incorrect-password',
        ])->assertUnprocessable()->assertJsonValidationErrors('owner_password');

        $this->assertDatabaseHas('orders', ['id' => $order->id]);
        $this->assertSame(1, Payment::count());
    }

    public function test_cashier_cannot_reset_transactions(): void
    {
        $cashier = User::factory()->create();
        $cashier->assignRole('cashier');

        $this->actingAs($cashier)->postJson('/api/settings/reset-transactions', [
            'owner_password' => 'password',
        ])->assertForbidden();
    }

    public function test_reset_obeys_the_admin_deletion_lock(): void
    {
        $order = $this->createTransactionHistory($this->owner, $this->product);
        Setting::query()->updateOrCreate(
            ['group' => 'system', 'key' => 'deletion_enabled'],
            ['value' => 'false', 'type' => 'string'],
        );

        $this->actingAs($this->owner)->postJson('/api/settings/reset-transactions', [
            'owner_password' => 'password',
        ])->assertForbidden()->assertJsonPath('message', 'Penghapusan data admin sedang dikunci. Owner dapat mengaktifkannya di Pengaturan > Sistem.');

        $this->assertDatabaseHas('orders', ['id' => $order->id]);
    }

    private function createTransactionHistory(User $owner, Product $product): Order
    {
        $order = Order::factory()->create([
            'cashier_id' => $owner->id,
            'order_number' => 'ORD-20261025-0001',
        ]);
        $item = OrderItem::factory()->create(['order_id' => $order->id, 'product_id' => $product->id]);
        Payment::factory()->create(['order_id' => $order->id, 'invoice_number' => 'INV-20261025-0001', 'user_id' => $owner->id]);
        OrderReturn::create([
            'request_id' => (string) Str::uuid(),
            'order_id' => $order->id,
            'order_item_id' => $item->id,
            'user_id' => $owner->id,
            'quantity' => 1,
            'amount' => 10000,
            'refund_method' => 'cash',
            'restocked' => false,
        ]);
        InventoryLog::create([
            'product_id' => $product->id,
            'product_name' => $product->name,
            'user_id' => $owner->id,
            'type' => 'adjustment',
            'quantity' => 1,
            'previous_stock' => 22,
            'new_stock' => 23,
        ]);
        CashClosing::create([
            'closing_date' => '2026-10-25', 'opening_cash' => 0, 'cash_out' => 0, 'cash_sales' => 45000,
            'cash_returns' => 0, 'expected_cash' => 45000, 'actual_cash' => 45000, 'difference' => 0, 'user_id' => $owner->id,
        ]);
        DB::table('checkout_requests')->insert([
            'id' => (string) Str::uuid(), 'business_id' => $owner->business_id, 'fingerprint' => str_repeat('a', 64),
            'order_id' => $order->id, 'created_at' => now(), 'updated_at' => now(),
        ]);
        DB::table('document_sequences')->insert([
            'business_id' => $owner->business_id, 'type' => 'order', 'sequence_date' => '2026-10-25', 'last_number' => 1,
        ]);
        DB::table('cash_day_locks')->insert(['business_id' => $owner->business_id, 'business_date' => '2026-10-25']);
        DatabaseNotification::query()->create([
            'id' => (string) Str::uuid(), 'type' => StoreActivity::class, 'notifiable_type' => User::class,
            'notifiable_id' => $owner->id, 'data' => ['category' => 'order'],
        ]);

        return $order;
    }
}
