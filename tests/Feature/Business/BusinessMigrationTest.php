<?php

declare(strict_types=1);

namespace Tests\Feature\Business;

use App\Models\Category;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Setting;
use App\Models\User;
use App\Services\BusinessContext;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class BusinessMigrationTest extends TestCase
{
    public function test_populated_single_store_is_assigned_without_losing_stock_history_or_document_numbers(): void
    {
        $paths = collect(glob(database_path('migrations/*.php')))
            ->reject(fn ($path) => str_starts_with(basename($path), '2026_10_24_1800'))
            ->map(fn ($path) => 'database/migrations/'.basename($path))->values()->all();
        Artisan::call('migrate:fresh', ['--path' => $paths]);
        app(BusinessContext::class)->resetSchema();
        try {
            $staff = User::factory()->create();
            $category = Category::factory()->create();
            $product = Product::factory()->create(['category_id' => $category->id, 'stock' => 47]);
            $order = Order::factory()->create(['cashier_id' => $staff->id, 'order_status' => 'completed', 'payment_status' => 'paid']);
            $item = OrderItem::factory()->create(['order_id' => $order->id, 'product_id' => $product->id]);
            Setting::create(['group' => 'store', 'key' => 'name', 'value' => 'Toko Lama QA']);
            DB::table('document_sequences')->insert(['type' => 'order', 'sequence_date' => now()->toDateString(), 'last_number' => 123]);

            $this->assertSame(0, Artisan::call('migrate'));
            $this->assertDatabaseHas('businesses', ['id' => BusinessContext::LEGACY_ID, 'name' => 'Toko Lama QA']);
            foreach (['users' => $staff, 'categories' => $category, 'products' => $product, 'orders' => $order, 'order_items' => $item] as $table => $model) {
                $this->assertDatabaseHas($table, ['id' => $model->id, 'business_id' => BusinessContext::LEGACY_ID]);
            }
            $this->assertDatabaseHas('products', ['id' => $product->id, 'stock' => 47]);
            $this->assertDatabaseHas('orders', ['id' => $order->id, 'order_number' => $order->order_number, 'cashier_id' => $staff->id]);
            $this->assertDatabaseHas('order_items', ['id' => $item->id, 'order_id' => $order->id, 'product_id' => $product->id]);
            $this->assertDatabaseHas('document_sequences', ['business_id' => BusinessContext::LEGACY_ID, 'last_number' => 123]);
            $this->assertSame(1, Product::count());
        } finally {
            Artisan::call('migrate:fresh');
            app(BusinessContext::class)->resetSchema();
        }
    }
}
