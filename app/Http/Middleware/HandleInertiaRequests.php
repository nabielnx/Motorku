<?php

namespace App\Http\Middleware;

use App\Models\Setting;
use Illuminate\Http\Request;
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

        // 1 query untuk semua settings yang dibutuhkan (ganti 8 query terpisah)
        $s = Setting::whereIn('group', ['store', 'system', 'restaurant', 'printer', 'catalog'])
            ->get()
            ->mapWithKeys(fn($row) => ["{$row->group}.{$row->key}" => $row->value])
            ->toArray();

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

            'logo_url' => $s['restaurant.logo'] ?? null,

            'app_settings' => [
                'timezone'           => $timezone,
                'locale'             => $s['system.locale']           ?? 'id',
                'restaurant_name'    => $s['restaurant.name']         ?? 'Toko Sparepart',
                'restaurant_address' => $s['restaurant.address']      ?? null,
                'restaurant_phone'   => $s['restaurant.phone']        ?? null,
                'auto_print_receipt' => ($s['printer.auto_print_receipt'] ?? 'true') !== 'false',
                'show_total_sold'    => ($s['catalog.show_total_sold']    ?? 'true') !== 'false',
            ],
        ];
    }
}
