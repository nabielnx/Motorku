<?php

namespace Tests\Feature;

use App\Contracts\PaymentGatewayInterface;
use App\Enums\InventoryLogType;
use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Models\InventoryLog;
use App\Models\Motorcycle;
use App\Models\MotorcyclePart;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use App\Services\DokuQrisService;
use App\Services\InventoryService;
use App\Services\OrderService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Tests\TestCase;

class ArchitectureRefactorTest extends TestCase
{
    use RefreshDatabase;

    protected User $owner;
    protected User $cashier;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\RoleSeeder::class);

        $this->owner = User::factory()->create();
        $this->owner->assignRole('owner');

        $this->cashier = User::factory()->create();
        $this->cashier->assignRole('cashier');
    }

    public function test_payment_gateway_interface_resolves_to_doku_service(): void
    {
        $gateway = app(PaymentGatewayInterface::class);
        $this->assertInstanceOf(DokuQrisService::class, $gateway);
    }

    public function test_order_model_uses_backed_enums(): void
    {
        $product = Product::factory()->create(['stock' => 10, 'is_available' => true]);

        $orderService = app(OrderService::class);
        $order = $orderService->createOrder([
            'customer_name' => 'Budi Utomo',
            'items' => [
                ['product_id' => $product->id, 'quantity' => 2],
            ],
        ], true);

        $this->assertInstanceOf(OrderStatus::class, $order->order_status);
        $this->assertEquals(OrderStatus::Pending, $order->order_status);
        $this->assertInstanceOf(PaymentStatus::class, $order->payment_status);
        $this->assertEquals(PaymentStatus::Unpaid, $order->payment_status);
        $this->assertNotNull($order->expires_at);
        $this->assertTrue($order->expires_at->isFuture());
    }

    public function test_stock_mutation_funnels_through_inventory_service(): void
    {
        $product = Product::factory()->create(['stock' => 15, 'is_available' => true]);

        $orderService = app(OrderService::class);
        $order = $orderService->createOrder([
            'customer_name' => 'Doni Customer',
            'items' => [
                ['product_id' => $product->id, 'quantity' => 3],
            ],
        ], true);

        // Product stock reduced to 12
        $this->assertEquals(12, $product->fresh()->stock);

        // Inventory log created via InventoryService
        $log = InventoryLog::where('product_id', $product->id)->latest()->first();
        $this->assertNotNull($log);
        $this->assertEquals(InventoryLogType::StockOut, $log->type);
        $this->assertEquals(3, $log->quantity);
        $this->assertStringContainsString($order->order_number, $log->note);
    }

    public function test_expire_stale_orders_command_cancels_order_and_restores_stock(): void
    {
        $product = Product::factory()->create(['stock' => 5, 'is_available' => true]);

        // Create an expired stale order (pending + unpaid + past expires_at)
        $order = Order::factory()->create([
            'order_status'   => OrderStatus::Pending,
            'payment_status' => PaymentStatus::Unpaid,
            'expires_at'     => now()->subMinutes(10),
        ]);

        OrderItem::factory()->create([
            'order_id'   => $order->id,
            'product_id' => $product->id,
            'quantity'   => 2,
        ]);

        // Create an active (not yet expired) order that should NOT be affected
        $activeOrder = Order::factory()->create([
            'order_status'   => OrderStatus::Pending,
            'payment_status' => PaymentStatus::Unpaid,
            'expires_at'     => now()->addMinutes(30),
        ]);

        // Run dry-run first
        $this->artisan('orders:expire-stale', ['--dry-run' => true])
            ->assertSuccessful();

        $this->assertEquals(OrderStatus::Pending, $order->fresh()->order_status);

        // Run actual command
        $this->artisan('orders:expire-stale')
            ->assertSuccessful();

        // Expired order cancelled
        $this->assertEquals(OrderStatus::Cancelled, $order->fresh()->order_status);

        // Active order untouched
        $this->assertEquals(OrderStatus::Pending, $activeOrder->fresh()->order_status);

        // Stock restored from 5 -> 7
        $this->assertEquals(7, $product->fresh()->stock);
    }

    public function test_motorcycle_soft_delete_and_restore_cascade_to_parts(): void
    {
        $motor = Motorcycle::create([
            'brand'       => 'Yamaha',
            'model'       => 'NMAX 155',
            'slug'        => 'yamaha-nmax-155-2020',
            'year_start'  => 2020,
            'engine_cc'   => 155,
            'engine_type' => 'matic',
        ]);
        $product = Product::factory()->create();

        $part = MotorcyclePart::create([
            'motorcycle_id'  => $motor->id,
            'product_id'     => $product->id,
            'part_category'  => 'oli_mesin',
            'is_recommended' => true,
        ]);

        $this->assertDatabaseHas('motorcycle_parts', ['id' => $part->id, 'deleted_at' => null]);

        // Soft delete motorcycle
        $motor->delete();

        // Part should now be soft deleted
        $this->assertSoftDeleted('motorcycle_parts', ['id' => $part->id]);

        // Restore motorcycle
        $motor->restore();

        // Part should now be restored
        $this->assertDatabaseHas('motorcycle_parts', ['id' => $part->id, 'deleted_at' => null]);
    }
}
