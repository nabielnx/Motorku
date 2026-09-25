<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('inventory_logs', function (Blueprint $table) {
            $table->decimal('previous_stock', 10, 2)->nullable()->after('quantity');
            $table->decimal('new_stock', 10, 2)->nullable()->after('previous_stock');
            $table->string('reference_type')->nullable()->after('new_stock');
            $table->uuid('reference_id')->nullable()->after('reference_type');

            $table->index(['reference_type', 'reference_id'], 'idx_inventory_logs_reference');
        });
    }

    public function down(): void
    {
        Schema::table('inventory_logs', function (Blueprint $table) {
            $table->dropIndex('idx_inventory_logs_reference');
            $table->dropColumn(['previous_stock', 'new_stock', 'reference_type', 'reference_id']);
        });
    }
};
