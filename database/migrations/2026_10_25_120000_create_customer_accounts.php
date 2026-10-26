<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customer_accounts', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('name', 120);
            $table->string('email', 254)->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password')->nullable();
            $table->string('google_id')->nullable()->unique();
            $table->unsignedInteger('auth_version')->default(1);
            $table->timestamps();
        });
        Schema::create('customer_profiles', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('business_id')->constrained()->restrictOnDelete();
            $table->foreignUuid('customer_account_id')->constrained()->cascadeOnDelete();
            $table->string('name', 120);
            $table->string('phone', 20)->nullable();
            $table->timestamps();
            $table->unique(['business_id', 'customer_account_id']);
        });
        Schema::create('customer_password_reset_tokens', function (Blueprint $table): void {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });
        Schema::table('orders', function (Blueprint $table): void {
            $table->foreignUuid('customer_account_id')->nullable()->constrained()->nullOnDelete();
            $table->index(['business_id', 'customer_account_id', 'created_at'], 'orders_customer_history_index');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table): void {
            $table->dropIndex('orders_customer_history_index');
            $table->dropConstrainedForeignId('customer_account_id');
        });
        Schema::dropIfExists('customer_password_reset_tokens');
        Schema::dropIfExists('customer_profiles');
        Schema::dropIfExists('customer_accounts');
    }
};
