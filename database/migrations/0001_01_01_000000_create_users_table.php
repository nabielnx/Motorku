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
        /*
        |--------------------------------------------------------------------------
        | Users
        |--------------------------------------------------------------------------
        */
        Schema::create('users', function (Blueprint $table) {
            // Primary Key
            $table->uuid('id')->primary();

            // User Information
            $table->string('name');
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();

            // Authentication
            $table->string('password');
            $table->rememberToken();

            // Business
            $table->boolean('is_active')->default(true);

            // Offline Sync
            $table->unsignedBigInteger('sync_version')->default(1);

            // Timestamps
            $table->timestamps();
            $table->softDeletes();

            // Index
            $table->index('is_active');
            $table->index('sync_version');
        });

        /*
        |--------------------------------------------------------------------------
        | Password Reset Tokens
        |--------------------------------------------------------------------------
        */
        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        /*
        |--------------------------------------------------------------------------
        | Sessions
        |--------------------------------------------------------------------------
        */
        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();

            $table->uuid('user_id')->nullable();

            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();

            $table->longText('payload');

            $table->integer('last_activity')->index();

            $table->foreign('user_id')
                ->references('id')
                ->on('users')
                ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sessions');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('users');
    }
};
