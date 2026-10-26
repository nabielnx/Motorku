<?php

declare(strict_types=1);

use App\Services\BusinessContext;
use App\Services\CacheService;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $changed = DB::transaction(function (): int {
            $business = DB::table('businesses')
                ->where('id', BusinessContext::LEGACY_ID)->whereRaw('BINARY `name` = ?', ['Motorku'])
                ->update(['name' => 'TokoM']);
            $setting = DB::table('settings')
                ->where('business_id', BusinessContext::LEGACY_ID)
                ->where('group', 'store')->where('key', 'name')->whereRaw('BINARY `value` = ?', ['Motorku'])
                ->update(['value' => 'TokoM']);

            return $business + $setting;
        });

        if ($changed > 0) {
            app(BusinessContext::class)->run(BusinessContext::LEGACY_ID, fn () => CacheService::flushSettings());
        }
    }

    public function down(): void
    {
        // Irreversible data backfill. Restoring an old brand could overwrite
        // names subsequently chosen by the owner; use a forward migration.
    }
};
