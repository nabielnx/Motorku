<?php

declare(strict_types=1);

use App\Services\BusinessContext;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private const UNIQUE = [
        'categories' => [['name']],
        'products' => [['sku']],
        'motorcycles' => [['slug']],
        'orders' => [['order_number']],
        'payments' => [['invoice_number'], ['gateway_reference']],
        'settings' => [['group', 'key']],
        'data_types' => [['kind', 'key'], ['kind', 'name']],
        'cash_closings' => [['closing_date']],
        'order_returns' => [['request_id']],
    ];

    private const TABLES = ['users', 'categories', 'products', 'motorcycles', 'motorcycle_parts', 'orders', 'order_items', 'payments', 'inventory_logs', 'order_returns', 'cash_closings', 'settings', 'data_types', 'reference_entries', 'reference_entry_product', 'suppliers', 'checkout_requests', 'product_sheet_imports', 'document_sequences', 'cash_day_locks'];

    public function up(): void
    {
        foreach (self::TABLES as $name) {
            Schema::table($name, function (Blueprint $table): void {
                $table->uuid('business_id')->nullable(false)->change();
                $table->foreign('business_id')->references('id')->on('businesses')->restrictOnDelete();
            });
        }
        foreach (self::UNIQUE as $name => $constraints) {
            foreach ($constraints as $columns) {
                Schema::table($name, function (Blueprint $table) use ($columns): void {
                    $table->dropUnique($columns);
                    $table->unique(['business_id', ...$columns]);
                });
            }
        }
        foreach (['document_sequences' => ['type', 'sequence_date'], 'cash_day_locks' => ['business_date'], 'checkout_requests' => ['id']] as $name => $columns) {
            Schema::table($name, function (Blueprint $table) use ($columns): void {
                // Keep an id index for the checkout order FK / UUID lookups.
                if ($columns === ['id']) {
                    $table->index('id');
                }
                $table->dropPrimary();
                $table->primary(['business_id', ...$columns]);
            });
        }
        app(BusinessContext::class)->resetSchema();
    }

    public function down(): void
    {
        if (DB::table('businesses')->where('id', '!=', BusinessContext::LEGACY_ID)->exists()) {
            throw new RuntimeException('Rollback multi-usaha memerlukan pemulihan backup database sebelum migrasi; data usaha tidak boleh digabung.');
        }
        foreach (['document_sequences' => ['type', 'sequence_date'], 'cash_day_locks' => ['business_date'], 'checkout_requests' => ['id']] as $name => $columns) {
            Schema::table($name, function (Blueprint $table) use ($columns): void {
                $table->dropPrimary();
                $table->primary($columns);
                if ($columns === ['id']) {
                    $table->dropIndex(['id']);
                }
            });
        }
        foreach (self::UNIQUE as $name => $constraints) {
            foreach ($constraints as $columns) {
                Schema::table($name, function (Blueprint $table) use ($columns): void {
                    $table->dropUnique(['business_id', ...$columns]);
                    $table->unique($columns);
                });
            }
        }
        foreach (self::TABLES as $name) {
            Schema::table($name, function (Blueprint $table): void {
                $table->dropForeign(['business_id']);
                $table->uuid('business_id')->nullable()->change();
            });
        }
    }
};
