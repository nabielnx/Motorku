<?php

namespace App\Http\Middleware;

use App\Services\SettingService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ApplySystemSettings
{
    public function handle(Request $request, Closure $next): Response
    {
        try {
            app(SettingService::class)->applyRuntimeSettings();
        } catch (\Throwable $e) {
            // Fallback gracefully
        }

        return $next($request);
    }
}
