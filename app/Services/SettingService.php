<?php

namespace App\Services;

use App\Models\Setting;

class SettingService
{
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
