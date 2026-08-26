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
        Schema::create('inventory_logs', function (Blueprint $table) {

            $table->uuid('id')->primary();

            $table->foreignUuid('product_id')
                ->constrained()
                ->cascadeOnUpdate()
                ->restrictOnDelete();

            $table->foreignUuid('user_id')
                ->nullable()
                ->constrained()
                ->cascadeOnUpdate()
                ->nullOnDelete();

            $table->enum('type', [
                'stock_in',
                'stock_out',
                'adjustment',
            ]);

            $table->decimal('quantity', 10, 2);

            $table->text('note')->nullable();

            $table->unsignedBigInteger('sync_version')->default(1);

            $table->timestamps();
            $table->softDeletes();

            $table->index('product_id');
            $table->index('user_id');
            $table->index('type');
            $table->index('sync_version');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventory_logs');
    }
};
