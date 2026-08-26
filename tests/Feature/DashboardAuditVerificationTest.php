<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use App\Services\DashboardService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardAuditVerificationTest extends TestCase
{
    use RefreshDatabase;

    private User $owner;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\RoleSeeder::class);

        $this->owner = User::factory()->create();
        $this->owner->assignRole('owner');
    }

    public function test_menu_terlaris_includes_today_items_excludes_historical_and_cancelled(): void
    {
        // 1. Historical product & order with 100 qty (from yesterday)
        $oldProduct = Product::factory()->create(['name' => 'Ban Lama 100 Porsi']);
        $oldOrder = Order::factory()->create([
            'created_at' => now()->subDays(10),
            'order_status' => 'completed',
        ]);
        OrderItem::factory()->create([
            'order_id' => $oldOrder->id,
            'product_id' => $oldProduct->id,
            'quantity' => 100,
        ]);

        // 2. Today cancelled order with 50 qty (should be ignored)
        $cancelledProduct = Product::factory()->create(['name' => 'Ban Cancelled']);
        $cancelledOrder = Order::factory()->create([
            'created_at' => now(),
            'order_status' => 'cancelled',
        ]);
        OrderItem::factory()->create([
            'order_id' => $cancelledOrder->id,
            'product_id' => $cancelledProduct->id,
            'quantity' => 50,
        ]);

        // 3. Today valid order with 2 different items (Item A: 5, Item B: 3)
        $todayProductA = Product::factory()->create(['name' => 'Ban Today A']);
        $todayProductB = Product::factory()->create(['name' => 'Ban Today B']);
        $todayOrder = Order::factory()->create([
            'created_at' => now(),
            'order_status' => 'pending',
        ]);
        OrderItem::factory()->create([
            'order_id' => $todayOrder->id,
            'product_id' => $todayProductA->id,
            'quantity' => 5,
        ]);
        OrderItem::factory()->create([
            'order_id' => $todayOrder->id,
            'product_id' => $todayProductB->id,
            'quantity' => 3,
        ]);

        $dashboardService = app(DashboardService::class);
        $stats = $dashboardService->getDashboardStats();
        $topSelling = $stats['top_selling'];

        // Assert only today's non-cancelled products appear
        $this->assertCount(2, $topSelling);
        $this->assertEquals('Ban Today A', $topSelling[0]['name']);
        $this->assertEquals(5, $topSelling[0]['count']);
        $this->assertEquals('Ban Today B', $topSelling[1]['name']);
        $this->assertEquals(3, $topSelling[1]['count']);
    }

    public function test_card_antrean_includes_ready_status_orders(): void
    {
        Order::factory()->create(['order_status' => 'pending']);
        Order::factory()->create(['order_status' => 'preparing']);
        Order::factory()->create(['order_status' => 'ready']); // Previously missing from count!
        Order::factory()->create(['order_status' => 'completed']); // Should not be counted as pending
        Order::factory()->create(['order_status' => 'cancelled']); // Should not be counted as pending

        $dashboardService = app(DashboardService::class);
        $stats = $dashboardService->getDashboardStats();

        // Total active pending/preparing/ready orders should be 3
        $this->assertEquals(3, $stats['pending_orders']);
    }

    public function test_dashboard_owner_page_renders_updated_labels(): void
    {
        $response = $this->actingAs($this->owner)->get('/dashboard');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => 
            $page->component('Dashboard/Owner/Index')
                 ->has('stats.pending_orders')
        );
    }
}
