<?php

namespace App\Http\Middleware;

use App\Models\Setting;
use App\Services\CacheService;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;

class ApplySystemSettings
{
    public function handle(Request $request, Closure $next): Response
    {
        try {
            $shared = Cache::remember(CacheService::SETTINGS_SHARED, CacheService::TTL_SETTINGS, fn () => Setting::whereIn('group', ['store', 'system', 'printer', 'catalog'])->get()
                ->mapWithKeys(fn ($row) => ["{$row->group}.{$row->key}" => $row->value])->all());
            $settings = ['timezone' => $shared['system.timezone'] ?? config('app.timezone'), 'locale' => $shared['system.locale'] ?? config('app.locale')];

            if (isset($settings['timezone'])) {
                date_default_timezone_set($settings['timezone']);
                config(['app.timezone' => $settings['timezone']]);
            }

            if (isset($settings['locale'])) {
                App::setLocale($settings['locale']);
            }
        } catch (\Throwable $e) {
            // Fallback gracefully
        }

        return $next($request);
    }
}
