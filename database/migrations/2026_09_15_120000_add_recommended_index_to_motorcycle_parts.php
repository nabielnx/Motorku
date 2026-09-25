<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('motorcycle_parts', function (Blueprint $table) {
            $table->index(['is_recommended', 'deleted_at'], 'idx_mp_recommended_active');
        });
    }

    public function down(): void
    {
        Schema::table('motorcycle_parts', function (Blueprint $table) {
            $table->dropIndex('idx_mp_recommended_active');
        });
    }
};
