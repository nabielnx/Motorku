<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Motorcycle;
use App\Models\MotorcyclePart;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Tests\TestCase;

class PermanentDeleteMigrationTest extends TestCase
{
    public function test_legacy_cleanup_removes_deleted_rows_and_preserves_related_history(): void
    {
        $migration = '2026_10_05_000001_use_permanent_deletes.php';
        $paths = collect(glob(database_path('migrations/*.php')))
            ->reject(fn ($path) => basename($path) === $migration)
            ->map(fn ($path) => 'database/migrations/'.basename($path))->values()->all();
        Artisan::call('migrate:fresh', ['--path' => $paths]);

        try {
            $product = Product::factory()->create();
            $staff = User::factory()->create();
            $order = Order::factory()->create(['cashier_id' => $staff->id, 'order_status' => 'completed', 'payment_status' => 'paid']);
            $item = OrderItem::factory()->create(['order_id' => $order->id, 'product_id' => $product->id]);
            $motor = Motorcycle::create(['brand' => 'Honda', 'model' => 'Archived', 'slug' => 'archived', 'year_start' => 2020, 'engine_cc' => 110, 'engine_type' => 'matic']);
            $part = MotorcyclePart::create(['motorcycle_id' => $motor->id, 'product_id' => $product->id, 'part_category' => 'oli_mesin']);
            $category = Category::create(['name' => 'Archived']);
            $logId = (string) Str::uuid();
            DB::table('inventory_logs')->insert(['id' => $logId, 'product_id' => $product->id, 'user_id' => $staff->id, 'type' => 'adjustment', 'quantity' => 1, 'created_at' => now(), 'updated_at' => now()]);
            foreach (['products' => $product->id, 'users' => $staff->id, 'motorcycles' => $motor->id, 'categories' => $category->id] as $table => $id) {
                DB::table($table)->where('id', $id)->update(['deleted_at' => now()]);
            }

            $this->assertSame(0, Artisan::call('migrate', ['--path' => 'database/migrations/'.$migration]));
            foreach (['products' => $product->id, 'users' => $staff->id, 'motorcycles' => $motor->id, 'categories' => $category->id, 'motorcycle_parts' => $part->id] as $table => $id) {
                $this->assertDatabaseMissing($table, ['id' => $id]);
                $this->assertFalse(Schema::hasColumn($table, 'deleted_at'));
            }
            $this->assertDatabaseHas('orders', ['id' => $order->id, 'cashier_id' => null]);
            $this->assertDatabaseHas('order_items', ['id' => $item->id, 'product_id' => null]);
            $this->assertDatabaseHas('inventory_logs', ['id' => $logId, 'product_id' => null, 'user_id' => null, 'product_name' => $product->name]);
        } finally {
            Artisan::call('migrate:fresh');
        }
    }
}
