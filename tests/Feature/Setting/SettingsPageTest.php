<?php

namespace Tests\Feature\Setting;

use App\Models\Setting;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class SettingsPageTest extends TestCase
{
    use RefreshDatabase;

    public function test_all_banner_slots_reach_customer_catalog_and_uploads_invalidate_cache(): void
    {
        Storage::fake('public');
        $this->seed(RoleSeeder::class);
        $owner = User::factory()->create();
        $owner->assignRole('owner');
        $this->actingAs($owner)->postJson('/api/settings', ['settings' => [
            ['group' => 'promo_banner', 'key' => 'enabled', 'value' => 'true'],
        ]])->assertOk();
        $this->get('/')->assertInertia(fn ($page) => $page->where('promoBanners.2', null));

        $urls = [];
        foreach ([1, 2, 3] as $slot) {
            $response = $this->postJson('/api/settings/banners', [
                'slot' => $slot, 'banner' => UploadedFile::fake()->image("banner-{$slot}.png", 1600, 500),
            ])->assertOk()->assertJsonPath('slot', $slot);
            $urls[$slot] = $response->json('url');
            $path = Setting::where('group', 'store')->where('key', 'promo_banner_'.$slot)->value('value');
            $this->assertStringEndsWith('.webp', $path);
            Storage::disk('public')->assertExists($path);
            $this->get('/')->assertInertia(fn ($page) => $page->where('promoBanners.'.$slot, $urls[$slot]));
        }
        $this->get('/')->assertInertia(fn ($page) => $page
            ->where('promoBanners.1', $urls[1])->where('promoBanners.2', $urls[2])->where('promoBanners.3', $urls[3]));
        $this->deleteJson('/api/settings/banners/1')->assertOk();
        $this->get('/')->assertInertia(fn ($page) => $page
            ->where('promoBanners.1', null)->where('promoBanners.2', $urls[2])->where('promoBanners.3', $urls[3]));
        $this->postJson('/api/settings', ['settings' => [
            ['group' => 'promo_banner', 'key' => 'enabled', 'value' => 'false'],
        ]])->assertOk();
        $this->get('/')->assertInertia(fn ($page) => $page
            ->where('promoBanners.1', null)->where('promoBanners.2', null)->where('promoBanners.3', null));
    }

    public function test_owner_receives_settings_and_image_urls_with_page(): void
    {
        $this->seed(RoleSeeder::class);
        $owner = User::factory()->create();
        $owner->assignRole('owner');

        foreach ([
            ['store', 'name', 'Toko Motor'],
            ['store', 'logo', 'logos/store.png'],
            ['store', 'qris_image', 'qris/store.png'],
            ['store', 'login_image', 'login-image/bg.png'],
            ['store', 'promo_banner_1', 'banners/first.png'],
        ] as [$group, $key, $value]) {
            Setting::create(compact('group', 'key', 'value'));
        }

        $this->actingAs($owner)->get('/settings')->assertOk()->assertInertia(fn ($page) => $page
            ->component('Setting/Index')
            ->where('initialSettings.store_name', 'Toko Motor')
            ->where('logoUrl', Storage::url('logos/store.png'))
            ->where('qrisUrl', Storage::url('qris/store.png'))
            ->where('loginImageUrl', Storage::url('login-image/bg.png'))
            ->where('bannerUrls.1', Storage::url('banners/first.png'))
            ->where('bannerUrls.2', null)
        );
    }

    public function test_owner_can_upload_and_delete_login_image(): void
    {
        Storage::fake('public');
        $this->seed(RoleSeeder::class);
        $owner = User::factory()->create();
        $owner->assignRole('owner');

        $response = $this->actingAs($owner)->postJson('/api/settings/login-image', [
            'login_image' => UploadedFile::fake()->image('login_bg.png', 1200, 800),
        ]);
        $response->assertOk()->assertJsonStructure(['message', 'url']);

        $path = Setting::where('group', 'store')->where('key', 'login_image')->value('value');
        $this->assertNotNull($path);
        Storage::disk('public')->assertExists($path);

        $deleteResponse = $this->actingAs($owner)->deleteJson('/api/settings/login-image');
        $deleteResponse->assertOk();

        $this->assertNull(Setting::where('group', 'store')->where('key', 'login_image')->value('value'));
        Storage::disk('public')->assertMissing($path);
    }

    public function test_deleted_qris_image_can_be_uploaded_again(): void
    {
        Storage::fake('public');
        $this->seed(RoleSeeder::class);
        $owner = User::factory()->create();
        $owner->assignRole('owner');

        $this->actingAs($owner)->postJson('/api/settings/qris-image', [
            'qris_image' => UploadedFile::fake()->image('first.png'),
        ])->assertOk();
        $this->deleteJson('/api/settings/qris-image')->assertOk();
        Setting::where('group', 'store')->where('key', 'qris_image')->firstOrFail()->delete();
        $this->postJson('/api/settings/qris-image', [
            'qris_image' => UploadedFile::fake()->image('second.png'),
        ])->assertOk();

        $this->assertSame(1, Setting::where('group', 'store')->where('key', 'qris_image')->count());
        $this->assertSame(1, Setting::query()->where('group', 'store')->where('key', 'qris_image')->count());
        $this->assertNotNull(Setting::where('group', 'store')->where('key', 'qris_image')->value('value'));
    }
}
