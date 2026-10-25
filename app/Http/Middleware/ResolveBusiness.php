<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Models\Business;
use App\Services\BusinessContext;
use App\Services\SettingService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class ResolveBusiness
{
    public function handle(Request $request, Closure $next): Response
    {
        $context = app(BusinessContext::class);
        if (! $context->ready()) {
            return $next($request);
        }
        $public = $request->routeIs('home', 'shop.home', 'pwa.manifest', 'sitemap', 'customer.*', 'motor-saya', 'motor-saya.parts', 'api.customer.*')
            || ($request->routeIs('login') && $request->query('shop') !== null);
        if ($public) {
            $slug = $request->route('businessSlug') ?? $request->query('shop');
            abort_if($slug !== null && (! is_string($slug) || ! preg_match('/^[a-z0-9-]{3,100}$/D', $slug)), 404);
            $business = $slug === null
                ? Business::findOrFail(BusinessContext::LEGACY_ID)
                : Business::where('slug', $slug)->whereNotNull('activated_at')->firstOrFail();
        } else {
            $user = $request->routeIs('api.user') ? $request->user('sanctum') : $request->user();
            $business = Business::findOrFail($user?->business_id ?? BusinessContext::LEGACY_ID);
        }
        $request->attributes->set('business', $business);
        $request->attributes->set('public_store', $public);
        // Explicit store selection travels in URLs, never in a shared browser session.
        $request->attributes->set('shop_slug', $public && isset($slug) ? $business->slug : null);
        $timezone = config('app.timezone');
        $locale = app()->getLocale();

        return $context->run($business->id, function () use ($request, $next, $timezone, $locale): Response {
            try {
                app(SettingService::class)->applyRuntimeSettings();

                return $next($request);
            } finally {
                config(['app.timezone' => $timezone]);
                date_default_timezone_set($timezone);
                app()->setLocale($locale);
            }
        });
    }
}
