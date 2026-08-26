<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('order_items', function (Blueprint $table) {

            // Primary Key
            $table->uuid('id')->primary();

            // Foreign Key
            $table->foreignUuid('order_id')
                ->constrained('orders')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();

            $table->foreignUuid('product_id')
                ->nullable()
                ->constrained('products')
                ->cascadeOnUpdate()
                ->nullOnDelete();

            // Snapshot Product
            $table->string('product_name');

            $table->string('product_sku');

            $table->decimal('unit_price', 15, 2);

            $table->decimal('discount_amount',15,2)->default(0);

            $table->unsignedInteger('quantity');

            $table->decimal('subtotal', 15, 2);

            $table->text('notes')->nullable();

            // Offline Sync
            $table->unsignedBigInteger('sync_version')->default(1);

            // Timestamp
            $table->timestamps();
            $table->softDeletes();

            // Index
            $table->index('order_id');
            $table->index('product_id');
            $table->index('sync_version');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_items');
    }
};
