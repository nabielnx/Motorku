<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Only add indexes if they don't already exist.
        // The orders.ordered_at index may already exist from the create_orders migration.
        Schema::table('payments', function (Blueprint $table) {
            $table->index('paid_at', 'payments_paid_at_index');
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropIndex('payments_paid_at_index');
        });
    }
};

