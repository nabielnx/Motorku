<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cash_closings', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->date('closing_date')->unique();
            $table->decimal('opening_cash', 15, 2);
            $table->decimal('cash_out', 15, 2);
            $table->decimal('cash_sales', 15, 2);
            $table->decimal('cash_returns', 15, 2);
            $table->decimal('expected_cash', 15, 2);
            $table->decimal('actual_cash', 15, 2);
            $table->decimal('difference', 15, 2);
            $table->string('notes', 255)->nullable();
            $table->foreignUuid('user_id')->constrained()->restrictOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cash_closings');
    }
};
