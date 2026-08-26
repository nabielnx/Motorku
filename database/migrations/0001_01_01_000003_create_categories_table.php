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
        Schema::create('categories', function (Blueprint $table) {
            // Primary Key
            $table->uuid('id')->primary();

            // Category
            $table->string('name')->unique();
            $table->text('description')->nullable();

            // Offline Sync
            $table->unsignedBigInteger('sync_version')->default(1);

            // Timestamp
            $table->timestamps();
            $table->softDeletes();

            // Index
            $table->index('sync_version');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('categories');
    }
};
