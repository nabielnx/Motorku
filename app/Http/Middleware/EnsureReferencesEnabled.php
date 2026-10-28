<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Services\SettingService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureReferencesEnabled
{
    public const MESSAGE = 'Pencarian referensi untuk pelanggan dinonaktifkan oleh owner.';

    public function handle(Request $request, Closure $next): Response
    {
        $settings = app(SettingService::class);
        $enabled = $request->routeIs('motor-saya', 'motor-saya.parts') ? $settings->publicMotorcyclesEnabled() : ($settings->referencesEnabled() || $settings->publicMotorcyclesEnabled());
        if ($enabled) {
            return $next($request);
        }

        if ($request->isMethod('GET') && ! $request->expectsJson() && ! $request->routeIs('motor-saya.parts', 'api.motorcycles.*')) {
            if ($request->routeIs('motor-saya', 'customer.references')) {
                $slug = $request->attributes->get('shop_slug');

                return $slug ? redirect()->route('shop.home', ['businessSlug' => $slug]) : redirect()->route('home');
            }

            return redirect()->route('settings.index')->with('warning', self::MESSAGE);
        }

        abort(403, self::MESSAGE);
    }
}
