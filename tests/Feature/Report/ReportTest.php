<?php

namespace Tests\Feature\Report;

use App\Models\Order;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReportTest extends TestCase
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

    public function test_owner_can_view_report_dashboard(): void
    {
        $response = $this->actingAs($this->owner)->get('/reports');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('Report/Index'));
    }

    public function test_cashier_cannot_view_report_dashboard(): void
    {
        $this->actingAs($this->cashier)
            ->get('/reports')
            ->assertStatus(403);
    }

    public function test_owner_can_fetch_report_summary_api(): void
    {
        $order = Order::factory()->create(['total' => 50000, 'order_status' => 'completed']);
        Payment::factory()->create([
            'order_id' => $order->id,
            'amount' => 50000,
            'status' => 'paid',
            'paid_at' => now(),
        ]);

        $response = $this->actingAs($this->owner)->getJson('/api/reports');

        $response->assertStatus(200)
            ->assertJsonPath('data.revenue', 50000)
            ->assertJsonPath('data.orders', 1);
    }

    public function test_owner_can_fetch_daily_report_api(): void
    {
        $order = Order::factory()->create(['total' => 30000, 'order_status' => 'completed']);
        Payment::factory()->create([
            'order_id' => $order->id,
            'amount' => 30000,
            'status' => 'paid',
            'paid_at' => now(),
        ]);

        $response = $this->actingAs($this->owner)->getJson('/api/reports/daily?date=' . now()->toDateString());

        $response->assertStatus(200)
            ->assertJsonPath('data.total_revenue', 30000)
            ->assertJsonPath('data.total_orders', 1);
    }

    public function test_dashboard_service_top_selling_filters_today_and_non_cancelled(): void
    {
        $productYesterday = \App\Models\Product::factory()->create(['name' => 'Yesterday Noodle']);
        $productCancelled = \App\Models\Product::factory()->create(['name' => 'Cancelled Noodle']);
        $productToday = \App\Models\Product::factory()->create(['name' => 'Today Noodle']);

        // Order 1: Yesterday order (should be ignored)
        $oldOrder = Order::factory()->create(['created_at' => now()->subDays(2), 'order_status' => 'completed', 'payment_status' => 'paid']);
        \App\Models\OrderItem::factory()->create(['order_id' => $oldOrder->id, 'product_id' => $productYesterday->id, 'quantity' => 99]);

        // Order 2: Today cancelled order (should be ignored)
        $cancelledOrder = Order::factory()->create(['created_at' => now(), 'order_status' => 'cancelled', 'payment_status' => 'unpaid']);
        \App\Models\OrderItem::factory()->create(['order_id' => $cancelledOrder->id, 'product_id' => $productCancelled->id, 'quantity' => 50]);

        // Order 3: Today valid order (should be counted)
        $todayOrder = Order::factory()->create(['created_at' => now(), 'order_status' => 'pending', 'payment_status' => 'paid']);
        Payment::factory()->create(['order_id' => $todayOrder->id, 'paid_at' => now()]);
        \App\Models\OrderItem::factory()->create(['order_id' => $todayOrder->id, 'product_id' => $productToday->id, 'quantity' => 5]);

        $stats = app(\App\Services\DashboardService::class)->getDashboardStats('today');
        $topSelling = $stats['top_selling'];

        $this->assertCount(1, $topSelling);
        $this->assertEquals('Today Noodle', $topSelling[0]['name']);
        $this->assertEquals(5, $topSelling[0]['count']);
    }
}
