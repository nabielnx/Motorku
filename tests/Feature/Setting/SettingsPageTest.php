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

    public function test_owner_receives_settings_and_image_urls_with_page(): void
    {
        $this->seed(RoleSeeder::class);
        $owner = User::factory()->create();
        $owner->assignRole('owner');

        foreach ([
            ['store', 'name', 'Toko Motor'],
            ['store', 'logo', 'logos/store.png'],
            ['store', 'qris_image', 'qris/store.png'],
            ['store', 'promo_banner_1', 'banners/first.png'],
        ] as [$group, $key, $value]) {
            Setting::create(compact('group', 'key', 'value'));
        }

        $this->actingAs($owner)->get('/settings')->assertOk()->assertInertia(fn ($page) => $page
            ->component('Setting/Index')
            ->where('initialSettings.store_name', 'Toko Motor')
            ->where('logoUrl', Storage::url('logos/store.png'))
            ->where('qrisUrl', Storage::url('qris/store.png'))
            ->where('bannerUrls.1', Storage::url('banners/first.png'))
            ->where('bannerUrls.2', null)
        );
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
        $this->assertSame(1, Setting::withTrashed()->where('group', 'store')->where('key', 'qris_image')->count());
        $this->assertNotNull(Setting::where('group', 'store')->where('key', 'qris_image')->value('value'));
    }
}
