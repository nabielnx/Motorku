<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private const INDEXES = [
        'products' => [['business_id', 'category_id']],
        'orders' => [['business_id', 'created_at'], ['business_id', 'order_status', 'payment_status', 'expires_at']],
        'payments' => [['business_id', 'status', 'paid_at']],
        'order_items' => [['business_id', 'product_id']],
        'inventory_logs' => [['business_id', 'created_at']],
        'reference_entries' => [['business_id', 'data_type_id', 'name']],
        'suppliers' => [['business_id', 'name']],
    ];

    public function up(): void
    {
        foreach (self::INDEXES as $name => $indexes) {
            foreach ($indexes as $index => $columns) {
                Schema::table($name, fn (Blueprint $table) => $table->index($columns, 'business_'.$name.'_'.$index));
            }
        }
    }

    public function down(): void
    {
        foreach (self::INDEXES as $name => $indexes) {
            foreach ($indexes as $index => $columns) {
                Schema::table($name, fn (Blueprint $table) => $table->dropIndex('business_'.$name.'_'.$index));
            }
        }
    }
};
