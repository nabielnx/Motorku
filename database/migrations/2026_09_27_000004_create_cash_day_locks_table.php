<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cash_day_locks', function (Blueprint $table) {
            $table->date('business_date')->primary();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cash_day_locks');
    }
};
