<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('motorcycle_parts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('motorcycle_id')->constrained('motorcycles')->cascadeOnDelete();
            $table->foreignUuid('product_id')->constrained('products')->cascadeOnDelete();
            $table->string('part_category', 50);  // oli, ban_depan, aki, busi, etc.
            $table->string('notes')->nullable();
            $table->boolean('is_recommended')->default(false);
            $table->timestamps();

            $table->unique(['motorcycle_id', 'product_id']);
            $table->index('part_category');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('motorcycle_parts');
    }
};
