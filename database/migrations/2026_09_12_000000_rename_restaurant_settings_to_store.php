<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('settings')
            ->where('group', 'restaurant')
            ->update(['group' => 'store']);
    }

    public function down(): void
    {
        DB::table('settings')
            ->where('group', 'store')
            ->whereIn('key', ['name', 'phone', 'email', 'address', 'logo', 'promo_banner_1', 'promo_banner_2', 'promo_banner_3'])
            ->update(['group' => 'restaurant']);
    }
};
