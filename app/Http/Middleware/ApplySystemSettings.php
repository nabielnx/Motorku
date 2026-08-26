<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Models\Setting;
use Illuminate\Support\Facades\App;
use Symfony\Component\HttpFoundation\Response;

class ApplySystemSettings
{
    public function handle(Request $request, Closure $next): Response
    {
        try {
            $settings = Setting::where('group', 'system')->get()->pluck('value', 'key');

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
