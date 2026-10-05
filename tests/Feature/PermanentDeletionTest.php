<?php

namespace Tests\Feature;

use App\Enums\InventoryLogType;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\Product;
use App\Models\User;
use App\Services\DashboardService;
use App\Services\InventoryService;
use App\Services\ProductService;
use App\Services\ReportService;
use App\Services\UserService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class PermanentDeletionTest extends TestCase
{
    use RefreshDatabase;

    public function test_product_deletion_preserves_invoice_snapshot_and_inventory_history(): void
    {
        $product = Product::factory()->create(['stock' => 5]);
        $order = Order::factory()->create(['order_status' => 'completed', 'payment_status' => 'paid']);
        $item = OrderItem::factory()->create(['order_id' => $order->id, 'product_id' => $product->id, 'product_name' => $product->name]);
        $log = app(InventoryService::class)->adjustStock(['product_id' => $product->id, 'type' => InventoryLogType::Adjustment, 'quantity' => 6]);

        app(ProductService::class)->deleteProduct($product->id);

        $this->assertDatabaseMissing('products', ['id' => $product->id]);
        $this->assertDatabaseHas('order_items', ['id' => $item->id, 'product_id' => null, 'product_name' => $product->name]);
        $this->assertDatabaseHas('inventory_logs', ['id' => $log->id, 'product_id' => null, 'product_name' => $product->name]);
        $this->assertDatabaseHas('orders', ['id' => $order->id]);
    }

    public function test_product_in_active_order_must_be_resolved_before_deletion(): void
    {
        $product = Product::factory()->create();
        $order = Order::factory()->create(['order_status' => 'pending', 'payment_status' => 'unpaid']);
        OrderItem::factory()->create(['order_id' => $order->id, 'product_id' => $product->id]);
        try {
            app(ProductService::class)->deleteProduct($product->id);
            $this->fail('Active order must prevent product deletion.');
        } catch (ValidationException) {
            $this->assertDatabaseHas('products', ['id' => $product->id]);
        }
    }

    public function test_deleted_products_remain_distinct_in_sales_reports(): void
    {
        foreach (['Oli A', 'Oli B'] as $name) {
            $product = Product::factory()->create(['name' => $name]);
            $order = Order::factory()->create(['order_status' => 'completed', 'payment_status' => 'paid']);
            Payment::factory()->create(['order_id' => $order->id]);
            OrderItem::factory()->create(['order_id' => $order->id, 'product_id' => $product->id, 'product_name' => $name, 'product_sku' => $product->sku]);
            app(ProductService::class)->deleteProduct($product->id);
        }
        $top = app(DashboardService::class)->getDashboardStats('today')['top_selling'];
        $this->assertEqualsCanonicalizing(['Oli A', 'Oli B'], $top->pluck('name')->all());
        $sales = app(ReportService::class)->getSalesByDateRange(now()->startOfDay(), now()->endOfDay());
        $this->assertEqualsCanonicalizing(['Oli A', 'Oli B'], $sales->pluck('product_name')->all());
    }

    public function test_staff_deletion_revokes_tokens_and_preserves_orders(): void
    {
        $user = User::factory()->create();
        $order = Order::factory()->create(['cashier_id' => $user->id]);
        $token = $user->createToken('test')->accessToken;

        app(UserService::class)->deleteEmployee($user->id);

        $this->assertDatabaseMissing('users', ['id' => $user->id]);
        $this->assertDatabaseMissing('personal_access_tokens', ['id' => $token->id]);
        $this->assertDatabaseHas('orders', ['id' => $order->id, 'cashier_id' => null]);
    }
}
