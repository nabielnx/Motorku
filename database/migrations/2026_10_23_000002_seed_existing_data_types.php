<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        $position = 0;
        foreach (['automotive' => 'Motor', 'electronics' => 'Elektronik', 'hardware' => 'Alat', 'bicycle' => 'Sepeda'] as $key => $name) {
            DB::table('data_types')->insert(['id' => (string) Str::uuid(), 'kind' => 'product', 'key' => $key, 'name' => $name,
                'fields' => '[]', 'is_system' => true, 'position' => $position++, 'created_at' => now(), 'updated_at' => now()]);
        }
        DB::table('data_types')->insert(['id' => (string) Str::uuid(), 'kind' => 'reference', 'key' => 'motorcycles', 'name' => 'Motor',
            'driver' => 'motorcycles', 'fields' => '[]', 'is_system' => true, 'created_at' => now(), 'updated_at' => now()]);
        // Preserve any historical group keys introduced outside the preset list.
        $known = DB::table('data_types')->where('kind', 'product')->pluck('key')->all();
        foreach (DB::table('categories')->whereNotIn('catalog_group', $known)->distinct()->pluck('catalog_group') as $key) {
            $name = mb_substr(Str::headline($key), 0, 60).' '.substr(hash('sha256', $key), 0, 8);
            DB::table('data_types')->insert(['id' => (string) Str::uuid(), 'kind' => 'product', 'key' => $key, 'name' => $name,
                'fields' => '[]', 'created_at' => now(), 'updated_at' => now()]);
        }
    }

    public function down(): void
    {
        // Retain configured types and user changes; schema rollback drops these new tables.
    }
};
