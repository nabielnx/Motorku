<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Models\DataType;
use App\Models\Setting;
use App\Services\CacheService;
use App\Services\CustomerAccountService;
use App\Services\GoogleLoginService;
use App\Services\ImagePreviewService;
use App\Services\PublicReferenceService;
use App\Services\SettingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        $user = $request->user();
        $business = $request->attributes->get('business');
        if ($request->attributes->get('public_store') && $user?->business_id !== $business?->id) {
            $user = null;
        }

        // 1 query untuk semua settings — cached for 60 min, flushed on save
        $platform = $request->attributes->get('platform_surface', false);
        $s = $platform ? [] : Cache::remember(CacheService::key(CacheService::SETTINGS_SHARED), CacheService::TTL_SETTINGS, function () {
            return Setting::whereIn('group', ['store', 'system', 'printer', 'catalog', 'payment', 'references'])
                ->get()
                ->mapWithKeys(fn ($row) => ["{$row->group}.{$row->key}" => $row->value])
                ->toArray();
        });

        $timezone = $s['system.timezone'] ?? 'Asia/Jakarta';

        return [
            ...parent::share($request),
            'customer' => fn () => $request->attributes->get('public_store') || $request->routeIs('customer.*') ? app(CustomerAccountService::class)->shared() : null,
            'google_login_enabled' => app(GoogleLoginService::class)->enabled(),
            'business' => $business ? ['id' => $business->id, 'name' => $business->name, 'slug' => $business->slug, 'public_url' => $business->publicUrl()] : null,
            'shop_slug' => $request->attributes->get('shop_slug'),
            'catalog_groups' => fn () => $platform ? [] : DataType::productGroups($user?->business_id ?? $business?->id),
            'reference_modules' => fn () => ! $platform && $user?->hasRole('owner') ? DataType::referenceModules($user->business_id) : [],
            'public_reference_modules' => fn () => $request->attributes->get('public_store') && ! $platform ? app(PublicReferenceService::class)->modules() : [],

            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'email_verified_at' => $user->email_verified_at?->toIso8601String(),
                    'avatar' => $user->avatar ?? null,
                ] : null,

                // Expose roles & permissions ke frontend (React/Vue)
                // Gunakan untuk kondisional tampilan UI
                'roles' => $user ? $user->getRoleNames() : [],
                'permissions' => $user ? $user->getAllPermissions()->pluck('name') : [],
            ],

            // Flash messages untuk notifikasi global
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
                'warning' => fn () => $request->session()->get('warning'),
            ],

            'logo_url' => ! empty($s['store.logo']) ? (str_starts_with($s['store.logo'], 'http') ? $s['store.logo'] : '/storage/'.ltrim($s['store.logo'], '/')) : null,
            'logo_preview_url' => ! empty($s['store.logo']) && ($preview = app(ImagePreviewService::class)->existing($s['store.logo'])) ? '/storage/'.$preview : null,
            'login_image_url' => ! empty($s['store.login_image']) ? (str_starts_with($s['store.login_image'], 'http') ? $s['store.login_image'] : '/storage/'.ltrim($s['store.login_image'], '/')) : null,

            'app_settings' => [
                'deletion_enabled' => ! array_key_exists('system.deletion_enabled', $s) || $s['system.deletion_enabled'] === 'true',
                'references_enabled' => ($s['references.enabled'] ?? 'true') !== 'false',
                'motorcycle_references_enabled' => ! $request->attributes->get('public_store') || (! $platform && app(SettingService::class)->publicMotorcyclesEnabled()),
                'cash_enabled' => ($s['payment.cash_enabled'] ?? 'true') !== 'false',
                'customer_qris_enabled' => ($s['payment.qris_enabled'] ?? 'true') !== 'false' && ! empty($s['store.qris_image']),
                'timezone' => $timezone,
                'locale' => $s['system.locale'] ?? 'id',
                'store_tagline' => $s['store.tagline'] ?? 'POS & ORDER',
                'store_name' => $s['store.name'] ?? 'TokoM',
                'store_address' => $s['store.address'] ?? null,
                'store_phone' => $s['store.phone'] ?? null,
                'auto_print_receipt' => ($s['printer.auto_print_receipt'] ?? 'true') !== 'false',
                'paper_size' => ($s['printer.paper_size'] ?? '80') === '58' ? '58' : '80',
                'show_total_sold' => ($s['catalog.show_total_sold'] ?? 'true') !== 'false',
            ],
        ];
    }
}
