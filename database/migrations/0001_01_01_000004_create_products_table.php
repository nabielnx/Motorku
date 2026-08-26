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
        Schema::create('products', function (Blueprint $table) {

            // Primary Key
            $table->uuid('id')->primary();

            // Foreign Key
            $table->foreignUuid('category_id')
                ->constrained('categories')
                ->cascadeOnUpdate()
                ->restrictOnDelete();

            // Product
            $table->string('sku')->unique();

            $table->string('name');

            $table->text('description')->nullable();

            $table->decimal('price', 15, 2);

            // Inventory
            $table->decimal('stock', 10, 2)->default(0);

            $table->decimal('minimum_stock', 10, 2)->default(0);

            $table->string('unit')->default('pcs');

            $table->string('image_path')->nullable();

            $table->boolean('is_available')->default(true);

            // Offline Sync
            $table->unsignedBigInteger('sync_version')->default(1);

            // Timestamp
            $table->timestamps();

            $table->softDeletes();

            // Index
            $table->index('category_id');
            $table->index('is_available');
            $table->index('sync_version');
            $table->index('name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
