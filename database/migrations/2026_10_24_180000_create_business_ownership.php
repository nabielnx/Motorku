<?php

declare(strict_types=1);

use App\Services\BusinessContext;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public const TABLES = ['users', 'categories', 'products', 'motorcycles', 'motorcycle_parts', 'orders', 'order_items', 'payments', 'inventory_logs', 'order_returns', 'cash_closings', 'settings', 'data_types', 'reference_entries', 'reference_entry_product', 'suppliers', 'checkout_requests', 'product_sheet_imports', 'document_sequences', 'cash_day_locks'];

    public function up(): void
    {
        Schema::create('businesses', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('name', 120);
            $table->string('slug', 100)->unique();
            $table->timestamp('activated_at')->nullable();
            $table->timestamps();
        });
        foreach (self::TABLES as $name) {
            Schema::table($name, fn (Blueprint $table) => $table->uuid('business_id')->nullable()->index());
        }
        app(BusinessContext::class)->resetSchema();
    }

    public function down(): void
    {
        foreach (array_reverse(self::TABLES) as $name) {
            Schema::table($name, fn (Blueprint $table) => $table->dropColumn('business_id'));
        }
        Schema::dropIfExists('businesses');
        app(BusinessContext::class)->resetSchema();
    }
};
