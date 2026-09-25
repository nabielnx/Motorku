<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('categories')
            ->where('name', 'Ban Luar Biasa / Tube Type')
            ->update([
                'name' => 'Ban Luar (Pakai Ban Dalam)',
                'sync_version' => DB::raw('sync_version + 1'),
                'updated_at' => now(),
            ]);
    }

    public function down(): void
    {
        DB::table('categories')
            ->where('name', 'Ban Luar (Pakai Ban Dalam)')
            ->update([
                'name' => 'Ban Luar Biasa / Tube Type',
                'sync_version' => DB::raw('sync_version + 1'),
                'updated_at' => now(),
            ]);
    }
};
