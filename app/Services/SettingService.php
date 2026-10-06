<?php

namespace App\Services;

use App\Models\Setting;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class SettingService
{
    public function saveAll(array $settings): void
    {
        DB::transaction(function () use ($settings) {
            foreach ($settings as $item) {
                $this->upsertSetting($item['group'], $item['key'], (string) ($item['value'] ?? ''));
            }
        });
        CacheService::flushSettings();
    }

    public function applyRuntimeSettings(): void
    {
        $settings = Cache::remember(CacheService::SETTINGS_SHARED, CacheService::TTL_SETTINGS,
            fn () => Setting::whereIn('group', ['store', 'system', 'printer', 'catalog'])->get()
                ->mapWithKeys(fn ($row) => ["{$row->group}.{$row->key}" => $row->value])->all());
        $timezone = $settings['system.timezone'] ?? config('app.timezone');
        if (in_array($timezone, ['Asia/Jakarta', 'Asia/Makassar', 'Asia/Jayapura'], true)) {
            date_default_timezone_set($timezone);
            config(['app.timezone' => $timezone]);
        }
        app()->setLocale($settings['system.locale'] ?? config('app.locale'));
    }

    public function getSettingById($id)
    {
        return Setting::find($id);
    }

    public function updateSetting($id, array $data)
    {
        $setting = Setting::findOrFail($id);

        if (isset($setting->sync_version)) {
            $data['sync_version'] = $setting->sync_version + 1;
        }

        $setting->update($data);
        CacheService::flushSettings();

        return $setting;
    }

    public function upsertSetting(string $group, string $key, string $value): Setting
    {
        $setting = Setting::query()->firstOrNew(['group' => $group, 'key' => $key]);
        $setting->fill(['value' => $value, 'type' => 'string']);
        $setting->save();

        return $setting;
    }
}
