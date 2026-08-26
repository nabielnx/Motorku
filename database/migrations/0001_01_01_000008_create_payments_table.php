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
        Schema::create('payments', function (Blueprint $table) {

            // Primary Key
            $table->uuid('id')->primary();

            // Foreign Key
            $table->foreignUuid('order_id')
                ->constrained('orders')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();

            // Payment
            $table->string('invoice_number')->unique();

            $table->string('gateway_reference')->nullable();

            $table->string('payment_channel')->nullable();

            $table->decimal('amount', 15, 2);

            $table->string('payment_method');

            $table->enum('status', [
                'pending',
                'paid',
                'failed',
                'expired',
                'cancelled',
                'refunded'
            ])->default('pending');

            $table->timestamp('paid_at')->nullable();

            $table->timestamp('expired_at')->nullable();

            $table->json('raw_response')->nullable();

            // Offline Sync
            $table->unsignedBigInteger('sync_version')->default(1);

            // Timestamp
            $table->timestamps();
            $table->softDeletes();

            // Index
            $table->index('order_id');
            $table->index('status');
            $table->index('payment_channel');
            $table->index('sync_version');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
