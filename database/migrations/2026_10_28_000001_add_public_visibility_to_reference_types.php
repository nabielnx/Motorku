<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('data_types', function (Blueprint $table) {
            $table->boolean('is_public')->default(false);
        });
        // Retain the existing customer motorcycle finder. Custom types require opt-in.
        DB::table('data_types')->where('kind', 'reference')->where('driver', 'motorcycles')->update(['is_public' => true]);
    }

    public function down(): void
    {
        Schema::table('data_types', fn (Blueprint $table) => $table->dropColumn('is_public'));
    }
};
