<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Business;
use App\Models\DataType;
use App\Models\Setting;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class SettingService
{
    public function referencesEnabled(): bool
    {
        return Setting::where('group', 'references')->where('key', 'enabled')->value('value') !== 'false';
    }

    public function publicMotorcyclesEnabled(): bool
    {
        return $this->referencesEnabled() && DataType::where('kind', 'reference')->where('driver', 'motorcycles')->where('is_public', true)->exists();
    }

    public function publicValues(): array
    {
        return Setting::where(function ($query): void {
            $query->where('group', 'store')->whereIn('key', ['name', 'logo', 'phone', 'address', 'tagline', 'open_time', 'close_time', 'promo_banner_1', 'promo_banner_2', 'promo_banner_3']);
        })->orWhere(function ($query): void {
            $query->where('group', 'tax')->whereIn('key', ['enabled', 'percentage']);
        })->orWhere(function ($query): void {
            $query->whereIn('group', ['catalog', 'promo_banner', 'qr_order', 'references'])->where('key', 'enabled');
        })->orWhere(function ($query): void {
            $query->where('group', 'catalog')->where('key', 'show_total_sold');
        })->get(['group', 'key', 'value'])->mapWithKeys(fn ($setting) => [$setting->group.'.'.$setting->key => $setting->value])->all();
    }

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
        $settings = Cache::remember(CacheService::key(CacheService::SETTINGS_SHARED), CacheService::TTL_SETTINGS,
            fn () => Setting::whereIn('group', ['store', 'system', 'printer', 'catalog', 'payment', 'references'])->get()
                ->mapWithKeys(fn ($row) => ["{$row->group}.{$row->key}" => $row->value])->all());
        $timezone = $settings['system.timezone'] ?? 'Asia/Jakarta';
        if (in_array($timezone, ['Asia/Jakarta', 'Asia/Makassar', 'Asia/Jayapura'], true)) {
            date_default_timezone_set($timezone);
            config(['app.timezone' => $timezone]);
        }
        app()->setLocale($settings['system.locale'] ?? 'id');
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
        if ($group === 'store' && $key === 'name') {
            Business::whereKey(app(BusinessContext::class)->id())->update(['name' => $value]);
        }

        return $setting;
    }
}
