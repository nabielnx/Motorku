<?php

namespace Tests\Feature\Setting;

use App\Models\Category;
use App\Models\InventoryLog;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\Product;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class ResetTransactionsTest extends TestCase
{
    use RefreshDatabase;

    protected User $owner;
    protected User $cashier;
    protected Product $product;

    protected function setUp(): void
    {
        parent::setUp();

        Role::firstOrCreate(['name' => 'owner', 'guard_name' => 'web']);
        Role::firstOrCreate(['name' => 'cashier', 'guard_name' => 'web']);

        $this->owner = User::factory()->create([
            'password' => Hash::make('password123'),
        ]);
        $this->owner->assignRole('owner');

        $this->cashier = User::factory()->create([
            'password' => Hash::make('password123'),
        ]);
        $this->cashier->assignRole('cashier');

        $category = Category::create(['name' => 'Sparepart']);
        $this->product = Product::create([
            'category_id' => $category->id,
            'sku' => 'SKU-TEST-01',
            'name' => 'Ban Luar Test',
            'price' => 25000,
            'stock' => 100,
            'is_available' => true,
        ]);
    }

    public function test_cashier_cannot_reset_transactions(): void
    {
        $response = $this->actingAs($this->cashier)
            ->postJson(route('api.settings.reset-transactions'), [
                'password' => 'password123',
            ]);

        $response->assertStatus(403);
    }

    public function test_reset_transactions_fails_with_wrong_password(): void
    {
        $response = $this->actingAs($this->owner)
            ->postJson(route('api.settings.reset-transactions'), [
                'password' => 'wrongpassword',
            ]);

        $response->assertStatus(422)
            ->assertJson([
                'message' => 'Kata sandi konfirmasi salah. Gagal melakukan reset transaksi.',
            ]);
    }

    public function test_owner_can_reset_all_transactions_and_preserve_products(): void
    {
        // Seed dummy transaction data
        $order = Order::create([
            'cashier_id' => $this->owner->id,
            'order_number' => 'ORD-20260808-0001',
            'customer_name' => 'Test Customer',
            'subtotal' => 25000,
            'total' => 25000,
            'order_status' => 'completed',
            'payment_status' => 'paid',
        ]);

        OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $this->product->id,
            'product_name' => $this->product->name,
            'product_sku' => $this->product->sku,
            'unit_price' => 25000,
            'quantity' => 1,
            'subtotal' => 25000,
        ]);

        Payment::create([
            'order_id' => $order->id,
            'invoice_number' => 'INV-20260808-0001',
            'payment_method' => 'cash',
            'amount' => 25000,
            'status' => 'paid',
            'paid_at' => now(),
        ]);

        InventoryLog::create([
            'product_id' => $this->product->id,
            'user_id' => $this->owner->id,
            'type' => 'stock_out',
            'quantity' => 1,
            'note' => 'Test order stock deduction',
        ]);

        // Verify data exists before reset
        $this->assertEquals(1, Order::count());
        $this->assertEquals(1, OrderItem::count());
        $this->assertEquals(1, Payment::count());
        $this->assertEquals(1, InventoryLog::count());

        // Perform reset
        $response = $this->actingAs($this->owner)
            ->postJson(route('api.settings.reset-transactions'), [
                'password' => 'password123',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Semua data transaksi berhasil direset! Toko siap digunakan dari awal.',
            ]);

        // Assert transaction data is completely cleared
        $this->assertEquals(0, Order::withTrashed()->count());
        $this->assertEquals(0, OrderItem::count());
        $this->assertEquals(0, Payment::count());
        $this->assertEquals(0, InventoryLog::count());

        // Assert products and categories remain untouched
        $this->assertEquals(1, Product::count());
        $this->assertEquals(1, Category::count());
    }
}
