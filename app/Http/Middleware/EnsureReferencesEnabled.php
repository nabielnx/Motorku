<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Models\DataType;
use App\Services\SettingService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureReferencesEnabled
{
    public const MESSAGE = 'Referensi dan Motor Saya dinonaktifkan oleh owner.';

    public function handle(Request $request, Closure $next): Response
    {
        if ($request->routeIs('data-types.*')) {
            $type = $request->route('type');
            $kind = $type instanceof DataType ? $type->kind : $request->input('kind', 'product');
            if ($kind !== 'reference') {
                return $next($request);
            }
        }

        if (app(SettingService::class)->referencesEnabled()) {
            return $next($request);
        }

        if ($request->isMethod('GET') && ! $request->expectsJson() && ! $request->routeIs('motor-saya.parts', 'api.motorcycles.*')) {
            if ($request->routeIs('motor-saya')) {
                $slug = $request->attributes->get('shop_slug');

                return $slug ? redirect()->route('shop.home', ['businessSlug' => $slug]) : redirect()->route('home');
            }

            return redirect()->route('settings.index')->with('warning', self::MESSAGE);
        }

        abort(403, self::MESSAGE);
    }
}
