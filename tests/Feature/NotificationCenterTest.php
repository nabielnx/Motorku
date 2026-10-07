<?php

namespace Tests\Feature;

use App\Enums\OrderStatus;
use App\Models\CashClosing;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use App\Notifications\StaffInvitation;
use App\Notifications\StoreActivity;
use App\Services\InventoryService;
use App\Services\NotificationService;
use App\Services\UserService;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Notifications\Events\NotificationSent;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class NotificationCenterTest extends TestCase
{
    use RefreshDatabase;

    private User $owner;

    private User $cashier;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleSeeder::class);
        $this->owner = User::factory()->create();
        $this->owner->assignRole('owner');
        $this->cashier = User::factory()->create();
        $this->cashier->assignRole('cashier');
    }

    public function test_notifications_are_private_paginated_and_read_per_account(): void
    {
        for ($i = 0; $i < 12; $i++) {
            app(NotificationService::class)->send('order', 'Pesanan baru', 'Pesanan uji', '/orders');
        }
        $response = $this->actingAs($this->owner)->getJson('/api/notifications')
            ->assertOk()->assertJsonPath('unread_count', 12)->assertJsonPath('items.total', 12)->assertJsonCount(10, 'items.data');
        $ownerId = $response->json('items.data.0.id');
        $cashierId = $this->cashier->notifications()->first()->id;
        $this->patchJson("/api/notifications/{$cashierId}/read")->assertNotFound();
        $this->patchJson("/api/notifications/{$ownerId}/read")->assertOk();
        $this->patchJson("/api/notifications/{$ownerId}/read")->assertOk();
        $this->getJson('/api/notifications?unread=1&page=2')->assertOk()
            ->assertJsonPath('unread_count', 11)->assertJsonPath('items.total', 11)->assertJsonCount(1, 'items.data');
        $this->getJson('/api/notifications?page=0')->assertUnprocessable();
        $this->getJson('/api/notifications?unread=garbage')->assertUnprocessable();
        $this->patchJson('/api/notifications/read-all')->assertOk();
        $this->getJson('/api/notifications?unread=1')->assertJsonPath('items.total', 0);
        $this->actingAs($this->cashier)->getJson('/api/notifications/summary')->assertJsonPath('unread_count', 12);
    }

    public function test_owner_only_notifications_are_hidden_after_role_change_and_nonactive_users_are_excluded(): void
    {
        $inactive = User::factory()->create(['is_active' => false]);
        $inactive->assignRole('owner');
        $unverified = User::factory()->unverified()->create();
        $unverified->assignRole('cashier');
        app(NotificationService::class)->send('staff', 'Staf diundang', 'Staf baru', '/users', true);
        app(NotificationService::class)->send('order', 'Pesanan baru', 'Pesanan baru', '/orders');
        $this->assertSame(0, $inactive->notifications()->count());
        $this->assertSame(0, $unverified->notifications()->count());
        $privateId = $this->owner->notifications()->where('data->category', 'staff')->first()->id;
        $this->actingAs($this->cashier)->getJson('/api/notifications')->assertJsonPath('items.total', 1);
        $this->owner->syncRoles(['cashier']);
        $this->actingAs($this->owner)->getJson('/api/notifications')->assertJsonPath('items.total', 1);
        $this->patchJson("/api/notifications/{$privateId}/read")->assertNotFound();
        $this->actingAs($unverified)->getJson('/api/notifications')->assertForbidden();
    }

    public function test_order_updates_and_stock_crossings_use_real_events_without_repeated_stock_alerts(): void
    {
        $product = Product::factory()->create(['stock' => 10, 'minimum_stock' => 3, 'is_available' => true]);
        $inventory = app(InventoryService::class);
        foreach ([3, 2, 0] as $stock) {
            $inventory->adjustStock(['product_id' => $product->id, 'type' => 'adjustment', 'quantity' => $stock], $this->owner->id);
        }
        $this->assertSame(2, $this->owner->notifications()->where('data->category', 'stock')->count());
        $inventory->adjustStock(['product_id' => $product->id, 'type' => 'stock_in', 'quantity' => 10], $this->owner->id);
        $inventory->adjustStock(['product_id' => $product->id, 'type' => 'stock_out', 'quantity' => 10], $this->owner->id);
        $this->assertSame(3, $this->owner->notifications()->where('data->category', 'stock')->count());

        $order = Order::factory()->create(['order_status' => 'pending', 'payment_status' => 'unpaid']);
        $order->update(['order_status' => OrderStatus::Cancelled]);
        $order->update(['notes' => 'Catatan berubah']);
        $this->assertSame(2, $this->owner->notifications()->where('data->category', 'order')->count());
        $this->actingAs($this->owner)->getJson('/api/notifications/summary')
            ->assertJsonPath('active_order_count', 0)->assertJsonPath('out_stock_count', 1);
    }

    public function test_checkout_retry_and_failed_payment_do_not_create_duplicate_or_phantom_notifications(): void
    {
        $product = Product::factory()->create(['stock' => 20, 'minimum_stock' => 0, 'price' => 10000]);
        $data = ['request_id' => fake()->uuid(), 'items' => [['product_id' => $product->id, 'quantity' => 1]], 'amount_received' => 10000];
        $this->actingAs($this->owner)->postJson('/api/orders/pos-sale', $data)->assertCreated();
        $this->postJson('/api/orders/pos-sale', $data)->assertCreated();
        $this->assertSame(2, $this->owner->notifications()->count());
        $this->assertSame(1, $this->owner->notifications()->where('data->category', 'payment')->count());
        $this->postJson('/api/orders/pos-sale', [...$data, 'request_id' => fake()->uuid(), 'amount_received' => 0])->assertUnprocessable();
        $this->assertSame(2, $this->owner->notifications()->count());
        $this->assertDatabaseCount('orders', 1);
    }

    public function test_cash_closing_is_owner_only_and_deleting_user_cleans_up_their_history(): void
    {
        CashClosing::create(['closing_date' => now()->toDateString(), 'opening_cash' => 0, 'cash_out' => 0,
            'cash_sales' => 0, 'cash_returns' => 0, 'expected_cash' => 0, 'actual_cash' => 10, 'difference' => 10, 'user_id' => $this->owner->id]);
        $this->assertSame(1, $this->owner->notifications()->count());
        $this->assertSame(0, $this->cashier->notifications()->count());
        $this->owner->delete();
        $this->assertDatabaseCount('notifications', 0);
    }

    public function test_staff_invitation_and_activation_record_owner_history_without_requiring_mail_for_database_alerts(): void
    {
        config(['mail.default' => 'array']);
        $token = null;
        Event::listen(NotificationSent::class, function (NotificationSent $event) use (&$token) {
            if ($event->notification instanceof StaffInvitation) {
                $token = $event->notification->token;
            }
        });
        $staff = app(UserService::class)->inviteEmployee(['name' => 'Staf Uji', 'email' => 'staff-notif@example.test', 'role' => 'cashier']);
        $this->assertSame(1, $this->owner->notifications()->where('data->category', 'staff')->count());
        $this->assertNotNull($token);
        app(UserService::class)->acceptInvitation(['email' => $staff->email, 'token' => $token,
            'password' => 'StaffPassword123!', 'password_confirmation' => 'StaffPassword123!']);
        $this->assertSame(2, $this->owner->notifications()->where('data->category', 'staff')->count());
        $this->assertSame(0, $this->cashier->notifications()->where('data->category', 'staff')->count());
        $this->assertSame(0, $staff->notifications()->count());
    }

    public function test_notifications_require_authentication_and_rollback_with_their_transaction(): void
    {
        $this->getJson('/api/notifications')->assertUnauthorized();
        DB::beginTransaction();
        app(NotificationService::class)->send('order', 'Uji rollback', 'Uji', '/orders');
        DB::rollBack();
        $this->assertDatabaseCount('notifications', 0);
        $this->assertDatabaseMissing('notifications', ['type' => StoreActivity::class]);
    }
}
