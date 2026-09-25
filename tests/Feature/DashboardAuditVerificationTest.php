<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
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
            'payment_status' => 'paid',
        ]);
        Payment::factory()->create(['order_id' => $todayOrder->id, 'paid_at' => now()]);
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

    public function test_sales_cards_and_top_products_use_payment_date(): void
    {
        $paidToday = Order::factory()->create([
            'created_at' => now()->subDays(10),
            'order_status' => 'completed',
            'payment_status' => 'paid',
            'total' => 80000,
        ]);
        Payment::factory()->create(['order_id' => $paidToday->id, 'paid_at' => now()]);
        $product = Product::factory()->create(['name' => 'Oli Dibayar Hari Ini']);
        OrderItem::factory()->create(['order_id' => $paidToday->id, 'product_id' => $product->id, 'quantity' => 2]);

        $paidEarlier = Order::factory()->create([
            'created_at' => now(),
            'order_status' => 'completed',
            'payment_status' => 'paid',
        ]);
        Payment::factory()->create(['order_id' => $paidEarlier->id, 'paid_at' => now()->subDays(10)]);
        OrderItem::factory()->create(['order_id' => $paidEarlier->id, 'quantity' => 10]);

        $stats = app(DashboardService::class)->getDashboardStats('today');

        $this->assertSame(80000.0, $stats['revenue_today']);
        $this->assertSame(1, $stats['orders_today']);
        $this->assertCount(1, $stats['top_selling']);
        $this->assertSame('Oli Dibayar Hari Ini', $stats['top_selling'][0]['name']);
    }

    public function test_stock_alert_uses_each_products_minimum_stock(): void
    {
        Product::factory()->create(['name' => 'Perlu Kulak', 'stock' => 5, 'minimum_stock' => 8]);
        Product::factory()->create(['name' => 'Masih Aman', 'stock' => 5, 'minimum_stock' => 2]);

        $alerts = app(DashboardService::class)->getDashboardStats()['low_stock'];

        $this->assertCount(1, $alerts);
        $this->assertSame('Perlu Kulak', $alerts[0]['name']);
    }

    public function test_dashboard_returns_only_five_best_selling_products(): void
    {
        $order = Order::factory()->create(['order_status' => 'completed', 'payment_status' => 'paid']);
        Payment::factory()->create(['order_id' => $order->id, 'paid_at' => now()]);
        $category = Category::factory()->create();

        for ($rank = 1; $rank <= 11; $rank++) {
            $product = Product::factory()->create(['category_id' => $category->id, 'name' => "Produk $rank"]);
            OrderItem::factory()->create([
                'order_id' => $order->id,
                'product_id' => $product->id,
                'quantity' => 12 - $rank,
            ]);
        }

        $topSelling = app(DashboardService::class)->getDashboardStats()['top_selling'];

        $this->assertCount(5, $topSelling);
        $this->assertSame('Produk 1', $topSelling[0]['name']);
        $this->assertSame('Produk 5', $topSelling[4]['name']);
    }

    public function test_daily_chart_marks_only_the_current_day(): void
    {
        $service = app(DashboardService::class);
        $weekly = $service->getDashboardStats('7_days')['sales_data'];
        $past = $service->getDashboardStats(
            'custom',
            now()->subDays(10)->toDateString(),
            now()->subDays(8)->toDateString()
        )['sales_data'];

        $this->assertCount(1, collect($weekly)->where('is_today', true));
        $this->assertCount(0, collect($past)->where('is_today', true));
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
