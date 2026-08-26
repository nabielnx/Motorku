<?php

namespace Tests\Feature\Order;

use App\Models\Category;
use App\Models\InventoryLog;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class PosAuditVerificationTest extends TestCase
{
    use RefreshDatabase;

    private function cashier(): User
    {
        Role::findOrCreate('cashier', 'web');
        $user = User::factory()->create();
        $user->assignRole('cashier');
        return $user;
    }

    // ─── SKENARIO 1: Penjualan Langsung POS (ambil di toko) ───
    #[Test]
    public function scenario_1_pos_direct_sale(): void
    {
        $cashier = $this->cashier();
        $product1 = Product::factory()->create(['is_available' => true, 'stock' => 10, 'price' => 15000]);
        $product2 = Product::factory()->create(['is_available' => true, 'stock' => 5, 'price' => 20000]);

        $response = $this->actingAs($cashier)->postJson('/api/orders', [
            'customer_name' => 'Pelanggan Normal',
            'order_type' => 'take_away',
            'items' => [
                ['product_id' => $product1->id, 'quantity' => 2],
                ['product_id' => $product2->id, 'quantity' => 1],
            ],
        ]);

        $response->assertCreated();

        // Order terbuat dengan tipe ambil di toko
        $this->assertDatabaseHas('orders', [
            'customer_name' => 'Pelanggan Normal',
            'order_type' => 'take_away',
            'order_status' => 'pending',
        ]);

        // Stok berkurang
        $product1->refresh();
        $product2->refresh();
        $this->assertEquals(8, $product1->stock);  // 10 - 2
        $this->assertEquals(4, $product2->stock);   // 5 - 1

        // Inventory log terbuat
        $this->assertDatabaseHas('inventory_logs', [
            'product_id' => $product1->id,
            'type' => 'stock_out',
            'quantity' => 2,
            'user_id' => $cashier->id,
        ]);
        $this->assertDatabaseHas('inventory_logs', [
            'product_id' => $product2->id,
            'type' => 'stock_out',
            'quantity' => 1,
            'user_id' => $cashier->id,
        ]);
    }

    // ─── SKENARIO 2: Stok Tidak Mencukupi ───
    #[Test]
    public function scenario_2_insufficient_stock(): void
    {
        $cashier = $this->cashier();
        $product = Product::factory()->create(['is_available' => true, 'stock' => 1]);

        $response = $this->actingAs($cashier)->postJson('/api/orders', [
            'customer_name' => 'Kasir 2',
            'order_type' => 'take_away',
            'items' => [['product_id' => $product->id, 'quantity' => 2]],
        ]);

        $response->assertUnprocessable();
        $this->assertStringContainsString('tidak mencukupi', $response->json('message') ?? $response->json('errors.items.0', ''));

        // Stok tidak minus
        $product->refresh();
        $this->assertEquals(1, $product->stock);
    }

    // ─── SKENARIO 3: XSS Input Sanitization ───
    #[Test]
    public function scenario_3_xss_input_sanitized(): void
    {
        $cashier = $this->cashier();
        $product = Product::factory()->create(['is_available' => true, 'stock' => 10]);

        $response = $this->actingAs($cashier)->postJson('/api/orders', [
            'customer_name' => '<script>alert(1)</script>',
            'order_type' => 'take_away',
            'items' => [
                ['product_id' => $product->id, 'quantity' => 1],
            ],
        ]);

        $response->assertCreated();

        // Tag HTML dihapus, konten dipertahankan
        $order = Order::latest()->first();
        $this->assertEquals('alert(1)', $order->customer_name);
        $this->assertStringNotContainsString('<script>', $order->customer_name);
    }

    // ─── SKENARIO 4: Max Quantity Per Item Limit (max 200) ───
    #[Test]
    public function scenario_4_max_quantity_validation(): void
    {
        $cashier = $this->cashier();
        $product = Product::factory()->create(['is_available' => true, 'stock' => 300]);

        $response = $this->actingAs($cashier)->postJson('/api/orders', [
            'customer_name' => 'Budi Excess Qty',
            'order_type' => 'take_away',
            'items' => [
                ['product_id' => $product->id, 'quantity' => 201],
            ],
        ]);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors(['items.0.quantity']);
    }

    // ─── SKENARIO 5: Max Items Per Order Limit (max 20) ───
    #[Test]
    public function scenario_5_max_items_validation(): void
    {
        $cashier = $this->cashier();
        $category = Category::factory()->create();
        $products = Product::factory()->count(21)->create([
            'category_id' => $category->id,
            'is_available' => true,
            'stock' => 10,
        ]);

        $items = $products->map(fn ($p) => ['product_id' => $p->id, 'quantity' => 1])->toArray();

        $response = $this->actingAs($cashier)->postJson('/api/orders', [
            'customer_name' => 'Budi Excess Items',
            'order_type' => 'take_away',
            'items' => $items,
        ]);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors(['items']);
    }
}
