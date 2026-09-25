<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $duplicates = DB::table('payments')
            ->select('gateway_reference')
            ->whereNotNull('gateway_reference')
            ->groupBy('gateway_reference')
            ->havingRaw('COUNT(*) > 1')
            ->pluck('gateway_reference');

        if ($duplicates->isNotEmpty()) {
            throw new \RuntimeException(
                'Migration dibatalkan: ditemukan gateway_reference duplikat: '
                . $duplicates->implode(', ')
                . '. Bersihkan data ini dulu secara manual sebelum menjalankan migration ini lagi.'
            );
        }

        Schema::table('payments', function (Blueprint $table) {
            $table->unique('gateway_reference');
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropUnique(['gateway_reference']);
        });
    }
};
