<?php

namespace Tests\Feature\Order;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\User;
use App\Services\OrderService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderListFilterTest extends TestCase
{
    use RefreshDatabase;

    public function test_action_filter_includes_open_orders_only(): void
    {
        $open = collect(['pending', 'preparing', 'ready'])
            ->map(fn ($status) => Order::factory()->create(['order_status' => $status]));
        Order::factory()->create(['order_status' => 'completed']);
        Order::factory()->create(['order_status' => 'cancelled']);

        $ids = app(OrderService::class)->getOrdersForWeb('action')->pluck('real_id')->all();

        $this->assertEqualsCanonicalizing($open->pluck('id')->all(), $ids);
    }

    public function test_search_finds_order_item_name_and_sku_across_orders(): void
    {
        $order = Order::factory()->create();
        OrderItem::factory()->create([
            'order_id' => $order->id,
            'product_name' => 'Ban IRC Ring 14',
            'product_sku' => 'IRC-R14',
        ]);
        Order::factory()->create();

        $service = app(OrderService::class);

        $this->assertSame([$order->id], $service->getOrdersForWeb(search: 'Ring 14')->pluck('real_id')->all());
        $this->assertSame([$order->id], $service->getOrdersForWeb(search: 'IRC-R14')->pluck('real_id')->all());
        $this->assertSame('Ban IRC Ring 14', $service->getOrdersForWeb(search: 'IRC-R14')->first()['matching_item']);
    }

    public function test_date_filter_limits_results_to_today_or_last_seven_days(): void
    {
        $this->travelTo(now()->startOfDay()->addHours(12));
        $today = Order::factory()->create(['created_at' => now()->subHour()]);
        $recent = Order::factory()->create(['created_at' => now()->subDays(3)]);
        Order::factory()->create(['created_at' => now()->subDays(8)]);

        $service = app(OrderService::class);

        $this->assertSame([$today->id], $service->getOrdersForWeb(date: 'today')->pluck('real_id')->all());
        $this->assertEqualsCanonicalizing(
            [$today->id, $recent->id],
            $service->getOrdersForWeb(date: 'week')->pluck('real_id')->all()
        );
    }

    public function test_orders_page_combines_filters_and_preserves_them_in_props(): void
    {
        $this->seed(\Database\Seeders\RoleSeeder::class);
        $cashier = User::factory()->create();
        $cashier->assignRole('cashier');
        $order = Order::factory()->create(['order_status' => 'pending']);
        OrderItem::factory()->create(['order_id' => $order->id, 'product_name' => 'Ban IRC Ring 14']);
        Order::factory()->create(['order_status' => 'completed']);

        $this->actingAs($cashier)
            ->get('/orders?status=action&date=today&search=Ban')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Order/Index')
                ->where('filters.status', 'action')
                ->where('filters.date', 'today')
                ->where('filters.search', 'Ban')
                ->where('initialOrders.total', 1)
                ->where('initialOrders.data.0.real_id', $order->id));
    }
}
