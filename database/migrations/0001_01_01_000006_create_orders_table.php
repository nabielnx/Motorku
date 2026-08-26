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
        Schema::create('orders', function (Blueprint $table) {

            // Primary Key
            $table->uuid('id')->primary();

            // Foreign Key
            $table->foreignUuid('cashier_id')
                ->nullable()
                ->constrained('users')
                ->cascadeOnUpdate()
                ->nullOnDelete();

            // Order
            $table->string('order_number')->unique();

            $table->string('customer_name')->nullable();
            $table->string('customer_phone')->nullable();

            // Payment Summary
            $table->decimal('subtotal', 15, 2)->default(0);
            $table->decimal('discount_amount', 15, 2)->default(0);
            $table->decimal('tax_amount', 15, 2)->default(0);
            $table->decimal('total', 15, 2)->default(0);

            // Notes
            $table->text('notes')->nullable();

            // Status
            $table->enum('order_status', [
                'pending',
                'preparing',
                'ready',
                'completed',
                'cancelled'
            ])->default('pending');

            $table->enum('order_type', [
                'dine_in',
                'take_away'
            ])->default('take_away');

            $table->enum('payment_status', [
                'unpaid',
                'partial',
                'paid',
                'refunded'
            ])->default('unpaid');

            // Offline Sync
            $table->unsignedBigInteger('sync_version')->default(1);

            // Timestamp
            $table->timestamps();
            $table->timestamp('ordered_at')->useCurrent();
            $table->softDeletes();

            // Index
            $table->index('cashier_id');
            $table->index('order_status');
            $table->index('ordered_at');
            $table->index('payment_status');
            $table->index('sync_version');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
