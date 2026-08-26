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
        Schema::create('settings', function (Blueprint $table) {

            // Primary Key
            $table->uuid('id')->primary();

            // Configuration
            $table->string('group');

            $table->string('key');

            $table->text('value')->nullable();

            $table->enum('type', [
                'string',
                'integer',
                'decimal',
                'boolean',
                'json'
            ])->default('string');

            // Offline Sync
            $table->unsignedBigInteger('sync_version')->default(1);

            // Timestamp
            $table->timestamps();
            $table->softDeletes();

            // Index
            $table->unique(['group', 'key']);
            $table->index('group');
            $table->index('sync_version');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('settings');
    }
};
