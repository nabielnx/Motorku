<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('data_types', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('kind', 20)->index();
            $table->string('key');
            $table->string('name', 80);
            $table->string('driver', 30)->nullable();
            $table->boolean('is_system')->default(false);
            $table->unsignedSmallInteger('position')->default(100);
            $table->json('fields');
            $table->unsignedInteger('sync_version')->default(1);
            $table->timestamps();
            $table->unique(['kind', 'key']);
            $table->unique(['kind', 'name']);
        });
        Schema::create('reference_entries', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('data_type_id')->constrained('data_types')->restrictOnDelete();
            $table->string('name', 160);
            $table->text('description')->nullable();
            $table->string('image_path')->nullable();
            $table->json('values');
            $table->unsignedInteger('sync_version')->default(1);
            $table->timestamps();
            $table->index(['data_type_id', 'name']);
        });
        Schema::create('reference_entry_product', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('reference_entry_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('product_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['reference_entry_id', 'product_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reference_entry_product');
        Schema::dropIfExists('reference_entries');
        Schema::dropIfExists('data_types');
    }
};
