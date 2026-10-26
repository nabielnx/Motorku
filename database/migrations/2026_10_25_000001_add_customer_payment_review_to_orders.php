<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->string('payment_preference', 20)->nullable();
            $table->timestamp('payment_review_requested_at')->nullable();
            $table->string('payment_reference', 100)->nullable();
            $table->string('payment_review_note', 255)->nullable();
            $table->string('cancel_reason', 32)->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('orders', fn (Blueprint $table) => $table->dropColumn([
            'payment_preference', 'payment_review_requested_at', 'payment_reference', 'payment_review_note', 'cancel_reason',
        ]));
    }
};
