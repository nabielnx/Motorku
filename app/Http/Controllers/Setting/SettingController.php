<?php

namespace App\Http\Controllers\Setting;

use App\Http\Controllers\Controller;
use App\Services\SettingService;
use App\Http\Requests\Setting\UpdateSettingRequest;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Support\Facades\Storage;

class SettingController extends Controller implements HasMiddleware
{
    protected $settingService;

    public function __construct(SettingService $settingService)
    {
        $this->settingService = $settingService;
    }

    public static function middleware(): array
    {
        return [
            new Middleware('role:owner'),
        ];
    }

    public function indexWeb()
    {
        return \Inertia\Inertia::render('Setting/Index');
    }

    public function index(): JsonResponse
    {
        $settings = Setting::all()->map(fn($s) => [
            'id' => $s->id,
            'group' => $s->group,
            'key' => $s->key,
            'value' => $s->value,
            'type' => $s->type,
        ]);

        return response()
            ->json(['data' => $settings])
            ->header('Cache-Control', 'no-store, no-cache, must-revalidate');
    }

    public function show($id): JsonResponse
    {
        $setting = $this->settingService->getSettingById($id);

        if (!$setting) {
            return response()->json(['message' => 'Pengaturan tidak ditemukan'], 404);
        }

        return response()->json($setting);
    }

    public function update(UpdateSettingRequest $request, $id): JsonResponse
    {
        $setting = $this->settingService->updateSetting($id, $request->validated());

        return response()->json([
            'message' => 'Pengaturan berhasil diperbarui!',
            'data' => $setting
        ]);
    }

    public function saveAll(Request $request): JsonResponse
    {
        // Per-field validation rules keyed by "group.key"
        $fieldRules = [
            'restaurant.name'          => ['required', 'string', 'max:100'],
            'restaurant.phone'         => ['required', 'string', 'regex:/^[0-9+\-\s()]{8,20}$/'],
            'restaurant.email'         => ['required', 'email', 'max:100'],
            'restaurant.address'       => ['required', 'string', 'max:500'],
            'tax.enabled'              => ['required', 'in:true,false'],
            'tax.percentage'           => ['numeric', 'min:0', 'max:100'],
            'payment.cash_enabled'     => ['required', 'in:true,false'],
            'payment.qris_enabled'     => ['required', 'in:true,false'],
            'payment.card_enabled'     => ['required', 'in:true,false'],
            'printer.paper_size'       => ['required', 'integer', 'in:58,80'],
            'printer.auto_print_receipt' => ['required', 'in:true,false'],
            'qr_order.enabled'         => ['required', 'in:true,false'],
            'qr_order.session_timeout' => ['integer', 'min:1', 'max:1440'],
            'catalog.show_total_sold'  => ['required', 'in:true,false'],
            'promo_banner.enabled'     => ['required', 'in:true,false'],
            'store.open_time'          => ['required', 'date_format:H:i'],
            'store.close_time'         => ['required', 'date_format:H:i'],
            'system.timezone'          => ['required', 'in:Asia/Jakarta,Asia/Makassar,Asia/Jayapura'],
            'system.locale'            => ['required', 'in:id,en'],
        ];

        $fieldMessages = [
            'restaurant.phone' => 'Nomor telepon hanya boleh berisi angka, +, -, spasi, dan tanda kurung (8-20 karakter).',
            'restaurant.email' => 'Format email tidak valid.',
            'restaurant.name'  => 'Nama toko wajib diisi (maks 100 karakter).',
            'restaurant.address' => 'Alamat toko wajib diisi (maks 500 karakter).',
            'tax.percentage'   => 'Persentase pajak harus angka antara 0-100.',
            'store.open_time'  => 'Format jam buka harus HH:MM.',
            'store.close_time' => 'Format jam tutup harus HH:MM.',
        ];

        $data = $request->validate([
            'settings' => ['required', 'array'],
            'settings.*.group' => ['required', 'string'],
            'settings.*.key' => ['required', 'string'],
            'settings.*.value' => ['nullable'],
        ]);

        foreach ($data['settings'] as $item) {
            $key = $item['group'] . '.' . $item['key'];
            if (isset($fieldRules[$key])) {
                $v = validator(['value' => $item['value']], ['value' => $fieldRules[$key]]);
                if ($v->fails()) {
                    $msg = $fieldMessages[$key] ?? $v->errors()->first('value');
                    return response()->json(['message' => $msg], 422);
                }
            }
        }

        foreach ($data['settings'] as $item) {
            $this->settingService->upsertSetting(
                $item['group'],
                $item['key'],
                (string) $item['value']
            );
        }

        return response()->json(['message' => 'Pengaturan berhasil disimpan!']);
    }

    public function uploadLogo(Request $request): JsonResponse
    {
        $request->validate([
            'logo' => ['required', 'image', 'mimes:jpeg,png,jpg,webp', 'max:2048'],
        ]);

        $old = Setting::where('group', 'restaurant')->where('key', 'logo')->value('value');
        if ($old) {
            Storage::disk('public')->delete($old);
        }

        $path = $request->file('logo')->store('logo', 'public');

        Setting::updateOrCreate(
            ['group' => 'restaurant', 'key' => 'logo'],
            ['value' => $path, 'type' => 'string']
        );

        return response()->json([
            'message' => 'Logo berhasil diupload!',
            'url' => Storage::url($path),
        ]);
    }

    public function getLogo(): JsonResponse
    {
        $path = Setting::where('group', 'restaurant')->where('key', 'logo')->value('value');

        return response()->json([
            'url' => $path ? Storage::url($path) : null,
        ]);
    }

    public function deleteLogo(): JsonResponse
    {
        $setting = Setting::where('group', 'restaurant')->where('key', 'logo')->first();
        if ($setting) {
            if ($setting->value) {
                Storage::disk('public')->delete($setting->value);
            }
            $setting->delete();
        }

        return response()->json([
            'message' => 'Logo berhasil dihapus!',
        ]);
    }

    /**
     * Upload banner promo untuk slot tertentu (1, 2, atau 3).
     */
    public function uploadPromoBanner(Request $request): JsonResponse
    {
        $request->validate([
            'banner' => ['required', 'image', 'mimes:jpeg,png,jpg,webp', 'max:3072'],
            'slot'   => ['required', 'integer', 'min:1', 'max:3'],
        ]);

        $slot = (int) $request->input('slot');
        $key  = 'promo_banner_' . $slot;

        $old = Setting::where('group', 'restaurant')->where('key', $key)->value('value');
        if ($old) {
            Storage::disk('public')->delete($old);
        }

        $path = $request->file('banner')->store('promo_banners', 'public');

        Setting::updateOrCreate(
            ['group' => 'restaurant', 'key' => $key],
            ['value' => $path, 'type' => 'string']
        );

        return response()->json([
            'message' => "Banner slot {$slot} berhasil diupload!",
            'url'     => Storage::url($path),
            'slot'    => $slot,
        ]);
    }

    /**
     * Hapus banner promo pada slot tertentu.
     */
    public function deletePromoBanner(int $slot): JsonResponse
    {
        if ($slot < 1 || $slot > 3) {
            return response()->json(['message' => 'Slot tidak valid (1-3).'], 422);
        }

        $key     = 'promo_banner_' . $slot;
        $setting = Setting::where('group', 'restaurant')->where('key', $key)->first();

        if ($setting) {
            if ($setting->value) {
                Storage::disk('public')->delete($setting->value);
            }
            $setting->delete();
        }

        return response()->json(['message' => "Banner slot {$slot} berhasil dihapus!"]);
    }

    /**
     * Ambil semua URL banner promo (slot 1-3).
     */
    public function getPromoBanners(): JsonResponse
    {
        $banners = [];
        foreach (range(1, 3) as $slot) {
            $path = Setting::where('group', 'restaurant')
                ->where('key', 'promo_banner_' . $slot)
                ->value('value');
            $banners[$slot] = $path ? Storage::url($path) : null;
        }

        return response()->json(['banners' => $banners]);
    }

    /**
     * Reset semua data transaksi (orders, order_items, payments, inventory_logs)
     * tanpa menghapus produk, user, dan settings.
     */
    public function resetTransactions(Request $request): JsonResponse
    {
        $request->validate([
            'password' => ['required', 'string'],
        ], [
            'password.required' => 'Kata sandi konfirmasi wajib diisi untuk keamanan.',
        ]);

        if (!\Illuminate\Support\Facades\Hash::check($request->password, $request->user()->password)) {
            return response()->json([
                'message' => 'Kata sandi konfirmasi salah. Gagal melakukan reset transaksi.',
            ], 422);
        }

        \Illuminate\Support\Facades\DB::transaction(function () {
            // Delete order items
            \App\Models\OrderItem::query()->delete();

            // Delete payments
            \App\Models\Payment::query()->delete();

            // Delete orders (force delete including soft deleted if any)
            \App\Models\Order::withTrashed()->forceDelete();

            // Delete inventory logs
            \App\Models\InventoryLog::query()->delete();
        });

        return response()->json([
            'message' => 'Semua data transaksi berhasil direset! Toko siap digunakan dari awal.',
        ]);
    }
}
