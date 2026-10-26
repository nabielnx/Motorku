<?php

declare(strict_types=1);

use App\Services\BusinessContext;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::transaction(function (): void {
            $name = DB::table('settings')->where('group', 'store')->where('key', 'name')->value('value') ?: 'Motorku';
            DB::table('businesses')->insert(['id' => BusinessContext::LEGACY_ID, 'name' => mb_substr($name, 0, 120), 'slug' => 'toko-utama', 'activated_at' => now(), 'created_at' => now(), 'updated_at' => now()]);
            foreach (['users', 'categories', 'products', 'motorcycles', 'motorcycle_parts', 'orders', 'order_items', 'payments', 'inventory_logs', 'order_returns', 'cash_closings', 'settings', 'data_types', 'reference_entries', 'reference_entry_product', 'suppliers', 'checkout_requests', 'product_sheet_imports', 'document_sequences', 'cash_day_locks'] as $table) {
                DB::table($table)->whereNull('business_id')->update(['business_id' => BusinessContext::LEGACY_ID]);
            }
        });
    }

    public function down(): void
    {
        // Ownership is intentionally retained until the schema migration is rolled back.
    }
};
