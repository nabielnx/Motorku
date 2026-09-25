<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement(
            "ALTER TABLE inventory_logs MODIFY COLUMN type ENUM('stock_in', 'stock_out', 'adjustment', 'stock_return') NOT NULL"
        );
    }

    public function down(): void
    {
        DB::statement(
            "ALTER TABLE inventory_logs MODIFY COLUMN type ENUM('stock_in', 'stock_out', 'adjustment') NOT NULL"
        );
    }
};
