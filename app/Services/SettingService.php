<?php

namespace App\Services;

use App\Models\Setting;

class SettingService
{
    public function getSettingById($id) {
        return Setting::find($id);
    }

    public function updateSetting($id, array $data) {
        $setting = Setting::findOrFail($id);

        if (isset($setting->sync_version)) {
            $data['sync_version'] = $setting->sync_version + 1;
        }

        $setting->update($data);
        return $setting;
    }

    public function upsertSetting(string $group, string $key, string $value): Setting
    {
        return Setting::updateOrCreate(
            ['group' => $group, 'key' => $key],
            ['value' => $value, 'type' => 'string']
        );
    }
}
