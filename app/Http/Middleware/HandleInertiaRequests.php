<?php

namespace App\Http\Middleware;

use App\Models\Setting;
use App\Services\CacheService;
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

        // 1 query untuk semua settings — cached for 60 min, flushed on save
        $s = Cache::remember(CacheService::SETTINGS_SHARED, CacheService::TTL_SETTINGS, function () {
            return Setting::whereIn('group', ['store', 'system', 'printer', 'catalog'])
                ->get()
                ->mapWithKeys(fn($row) => ["{$row->group}.{$row->key}" => $row->value])
                ->toArray();
        });

        $timezone = $s['system.timezone'] ?? 'Asia/Jakarta';

        return [
            ...parent::share($request),

            'auth' => [
                'user' => $user ? [
                    'id'     => $user->id,
                    'name'   => $user->name,
                    'email'  => $user->email,
                    'avatar' => $user->avatar ?? null,
                ] : null,

                // Expose roles & permissions ke frontend (React/Vue)
                // Gunakan untuk kondisional tampilan UI
                'roles'       => $user ? $user->getRoleNames() : [],
                'permissions' => $user ? $user->getAllPermissions()->pluck('name') : [],
            ],

            // Flash messages untuk notifikasi global
            'flash' => [
                'success' => fn() => $request->session()->get('success'),
                'error'   => fn() => $request->session()->get('error'),
                'warning' => fn() => $request->session()->get('warning'),
            ],

            'logo_url' => !empty($s['store.logo']) ? (str_starts_with($s['store.logo'], 'http') ? $s['store.logo'] : '/storage/' . ltrim($s['store.logo'], '/')) : null,

            'app_settings' => [
                'timezone'           => $timezone,
                'locale'             => $s['system.locale']           ?? 'id',
                'store_name'         => $s['store.name']                ?? 'Motorku',
                'store_address'      => $s['store.address']             ?? null,
                'store_phone'        => $s['store.phone']               ?? null,
                'auto_print_receipt' => ($s['printer.auto_print_receipt'] ?? 'true') !== 'false',
                'show_total_sold'    => ($s['catalog.show_total_sold']    ?? 'true') !== 'false',
            ],
        ];
    }
}
