<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('businesses')->orderBy('id')->eachById(function ($business): void {
            $previouslyEnabled = DB::table('settings')->where('business_id', $business->id)->where('group', 'references')->where('key', 'enabled')->value('value') !== 'false';
            $motor = DB::table('data_types')->where('business_id', $business->id)->where('kind', 'reference')->where('driver', 'motorcycles')->where('is_public', true)->exists();
            DB::table('settings')->insertOrIgnore(['id' => (string) Str::uuid(), 'business_id' => $business->id,
                'group' => 'references', 'key' => 'motorcycles_enabled', 'value' => $previouslyEnabled && $motor ? 'true' : 'false',
                'type' => 'string', 'sync_version' => 1, 'created_at' => now(), 'updated_at' => now()]);
        });
    }

    public function down(): void
    {
        // Keep owner choices. Rolling back code must not remove configuration or mappings.
    }
};
