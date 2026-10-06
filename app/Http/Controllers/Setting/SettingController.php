<?php

namespace App\Http\Controllers\Setting;

use App\Http\Controllers\Controller;
use App\Http\Requests\ImageUploadRequest;
use App\Http\Requests\Setting\SaveSettingsRequest;
use App\Http\Requests\Setting\UpdateSettingRequest;
use App\Models\Setting;
use App\Services\CacheService;
use App\Services\ImageUploadService;
use App\Services\SettingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

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
            new Middleware('role:owner', except: ['getQrisImage']),
        ];
    }

    public function indexWeb()
    {
        $settings = Setting::all(['group', 'key', 'value'])->mapWithKeys(fn ($setting) => [
            $setting->group.'_'.$setting->key => $setting->value,
        ]);
        $imageUrl = fn (string $key) => ($path = $settings->get('store_'.$key))
            ? Storage::url($path)
            : null;

        return Inertia::render('Setting/Index', [
            'initialSettings' => $settings,
            'logoUrl' => $imageUrl('logo'),
            'qrisUrl' => $imageUrl('qris_image'),
            'loginImageUrl' => $imageUrl('login_image'),
            'bannerUrls' => collect(range(1, 3))->mapWithKeys(fn ($slot) => [
                $slot => $imageUrl('promo_banner_'.$slot),
            ]),
        ]);
    }

    public function index(): JsonResponse
    {
        $settings = Setting::all()->map(fn ($s) => [
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

        if (! $setting) {
            return response()->json(['message' => 'Pengaturan tidak ditemukan'], 404);
        }

        return response()->json($setting);
    }

    public function update(UpdateSettingRequest $request, $id): JsonResponse
    {
        $setting = $this->settingService->updateSetting($id, $request->validated());

        return response()->json([
            'message' => 'Pengaturan berhasil diperbarui!',
            'data' => $setting,
        ]);
    }

    public function saveAll(SaveSettingsRequest $request): JsonResponse
    {
        $this->settingService->saveAll($request->validated('settings'));

        return response()->json(['message' => 'Pengaturan berhasil disimpan!']);
    }

    public function uploadLogo(ImageUploadRequest $request): JsonResponse
    {
        $old = Setting::where('group', 'store')->where('key', 'logo')->value('value');
        $path = app(ImageUploadService::class)->replace($request->file('logo'), 'logo', $old,
            function ($path) {
                $this->settingService->upsertSetting('store', 'logo', $path);

                return $path;
            }, 'logo');

        CacheService::flushSettings();

        return response()->json([
            'message' => 'Logo berhasil diupload!',
            'url' => Storage::url($path),
        ]);
    }

    public function getLogo(): JsonResponse
    {
        $path = Setting::where('group', 'store')->where('key', 'logo')->value('value');

        return response()->json([
            'url' => $path ? Storage::url($path) : null,
        ]);
    }

    public function deleteLogo(): JsonResponse
    {
        $setting = Setting::where('group', 'store')->where('key', 'logo')->first();
        if ($setting) {
            $old = $setting->value;
            $setting->update(['value' => null]);
            if ($old) {
                Storage::disk('public')->delete($old);
            }
        }

        CacheService::flushSettings();

        return response()->json([
            'message' => 'Logo berhasil dihapus!',
        ]);
    }

    public function uploadQrisImage(ImageUploadRequest $request): JsonResponse
    {
        $old = Setting::where('group', 'store')->where('key', 'qris_image')->value('value');
        $path = app(ImageUploadService::class)->replace($request->file('qris_image'), 'qris', $old,
            function ($path) {
                $this->settingService->upsertSetting('store', 'qris_image', $path);

                return $path;
            }, 'qris_image');
        CacheService::flushSettings();

        return response()->json([
            'message' => 'Gambar QRIS berhasil diupload!',
            'url' => Storage::url($path),
        ]);
    }

    public function getQrisImage(): JsonResponse
    {
        $path = Setting::where('group', 'store')->where('key', 'qris_image')->value('value');

        return response()->json(['url' => $path ? Storage::url($path) : null]);
    }

    public function deleteQrisImage(): JsonResponse
    {
        $setting = Setting::where('group', 'store')->where('key', 'qris_image')->first();
        if ($setting) {
            $old = $setting->value;
            $setting->update(['value' => null]);
            if ($old) {
                Storage::disk('public')->delete($old);
            }
        }
        CacheService::flushSettings();

        return response()->json(['message' => 'Gambar QRIS berhasil dihapus!']);
    }

    public function uploadLoginImage(ImageUploadRequest $request): JsonResponse
    {
        $old = Setting::where('group', 'store')->where('key', 'login_image')->value('value');
        $path = app(ImageUploadService::class)->replace($request->file('login_image'), 'login-image', $old,
            function ($path) {
                $this->settingService->upsertSetting('store', 'login_image', $path);

                return $path;
            }, 'login_image');
        CacheService::flushSettings();

        return response()->json([
            'message' => 'Gambar login berhasil diupload!',
            'url' => Storage::url($path),
        ]);
    }

    public function deleteLoginImage(): JsonResponse
    {
        $setting = Setting::where('group', 'store')->where('key', 'login_image')->first();
        if ($setting) {
            $old = $setting->value;
            $setting->update(['value' => null]);
            if ($old) {
                Storage::disk('public')->delete($old);
            }
        }
        CacheService::flushSettings();

        return response()->json(['message' => 'Gambar login berhasil dihapus!']);
    }

    /**
     * Upload banner promo untuk slot tertentu (1, 2, atau 3).
     */
    public function uploadPromoBanner(ImageUploadRequest $request): JsonResponse
    {
        $slot = (int) $request->input('slot');
        $key = 'promo_banner_'.$slot;

        $old = Setting::where('group', 'store')->where('key', $key)->value('value');
        $path = app(ImageUploadService::class)->replace($request->file('banner'), 'promo_banners', $old,
            function ($path) use ($key) {
                $this->settingService->upsertSetting('store', $key, $path);

                return $path;
            }, 'banner');

        CacheService::flushSettings();

        return response()->json([
            'message' => "Banner slot {$slot} berhasil diupload!",
            'url' => Storage::url($path),
            'slot' => $slot,
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

        $key = 'promo_banner_'.$slot;
        $setting = Setting::where('group', 'store')->where('key', $key)->first();

        if ($setting) {
            $old = $setting->value;
            $setting->update(['value' => null]);
            if ($old) {
                Storage::disk('public')->delete($old);
            }
        }

        CacheService::flushSettings();

        return response()->json(['message' => "Banner slot {$slot} berhasil dihapus!"]);
    }

    /**
     * Ambil semua URL banner promo (slot 1-3).
     */
    public function getPromoBanners(): JsonResponse
    {
        $banners = [];
        foreach (range(1, 3) as $slot) {
            $path = Setting::where('group', 'store')
                ->where('key', 'promo_banner_'.$slot)
                ->value('value');
            $banners[$slot] = $path ? Storage::url($path) : null;
        }

        return response()->json(['banners' => $banners]);
    }
}
