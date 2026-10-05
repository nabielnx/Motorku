<?php

use App\Models\User;
use App\Services\DocumentNumberService;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private array $tables = [
        'motorcycle_parts', 'order_items', 'payments', 'inventory_logs',
        'orders', 'motorcycles', 'products', 'categories', 'settings', 'users',
    ];

    public function up(): void
    {
        // Check dependencies before any schema or data changes.
        $deletedProducts = DB::table('products')->whereNotNull('deleted_at')->pluck('id');
        $deletedCategories = DB::table('categories')->whereNotNull('deleted_at')->pluck('id');
        if (DB::table('products')->whereNull('deleted_at')->whereIn('category_id', $deletedCategories)->exists()) {
            throw new RuntimeException('Pindahkan produk aktif dari kategori terhapus sebelum migrasi hard delete.');
        }
        if (DB::table('order_items')->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->whereNull('orders.deleted_at')->whereNull('order_items.deleted_at')
            ->whereIn('order_items.product_id', $deletedProducts)
            ->whereIn('orders.order_status', ['pending', 'preparing', 'ready'])->exists()) {
            throw new RuntimeException('Selesaikan pesanan aktif yang memakai produk terhapus sebelum migrasi hard delete.');
        }
        $deletedOrders = DB::table('orders')->whereNotNull('deleted_at')->pluck('id');
        $deletedItems = DB::table('order_items')->whereNotNull('deleted_at')->pluck('id');
        if (DB::table('order_returns')->whereIn('order_id', $deletedOrders)->orWhereIn('order_item_id', $deletedItems)->exists()) {
            throw new RuntimeException('Ada retur yang terkait transaksi terhapus. Tinjau data tersebut sebelum migrasi hard delete.');
        }

        Schema::table('personal_access_tokens', fn (Blueprint $table) => $table->uuid('tokenable_id')->change());

        Schema::table('inventory_logs', function (Blueprint $table) {
            $table->string('product_name')->nullable();
        });
        DB::table('inventory_logs')->orderBy('id')->chunkById(500, function ($logs) {
            $names = DB::table('products')->whereIn('id', $logs->pluck('product_id'))->pluck('name', 'id');
            foreach ($logs as $log) {
                DB::table('inventory_logs')->where('id', $log->id)->update(['product_name' => $names[$log->product_id] ?? null]);
            }
        });

        foreach ([['inventory_logs', 'product_id', 'products'], ['order_returns', 'user_id', 'users'], ['cash_closings', 'user_id', 'users']] as [$name, $column, $parent]) {
            Schema::table($name, fn (Blueprint $table) => $table->dropForeign([$column]));
            Schema::table($name, function (Blueprint $table) use ($column, $parent) {
                $table->uuid($column)->nullable()->change();
                $table->foreign($column)->references('id')->on($parent)->nullOnDelete();
            });
        }

        DB::transaction(function () {
            $numbers = app(DocumentNumberService::class);
            foreach (['orders' => ['order', 'order_number'], 'payments' => ['invoice', 'invoice_number']] as $name => [$type, $column]) {
                DB::table($name)->select('id', $column)->orderBy('id')->chunkById(500, function ($documents) use ($numbers, $type, $column) {
                    foreach ($documents as $document) {
                        $numbers->remember($type, $document->$column);
                    }
                });
            }
            $deletedUsers = DB::table('users')->whereNotNull('deleted_at')->pluck('id');
            foreach (['model_has_roles', 'model_has_permissions'] as $pivot) {
                DB::table($pivot)->where('model_type', User::class)->whereIn('model_id', $deletedUsers)->delete();
            }
            if (Schema::hasTable('personal_access_tokens')) {
                DB::table('personal_access_tokens')->where('tokenable_type', User::class)->whereIn('tokenable_id', $deletedUsers)->delete();
            }
            foreach ($this->tables as $name) {
                DB::table($name)->whereNotNull('deleted_at')->delete();
            }
        });

        Schema::table('motorcycle_parts', fn (Blueprint $table) => $table->dropIndex('idx_mp_recommended_active'));
        foreach ($this->tables as $name) {
            Schema::table($name, fn (Blueprint $table) => $table->dropSoftDeletes());
        }
        Schema::table('motorcycle_parts', fn (Blueprint $table) => $table->index('is_recommended', 'idx_mp_recommended_active'));
    }

    public function down(): void
    {
        throw new RuntimeException('Hard delete tidak dapat mengembalikan baris yang dihapus. Pulihkan backup database untuk rollback.');
    }
};
