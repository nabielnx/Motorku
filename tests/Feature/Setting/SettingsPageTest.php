<?php

namespace Tests\Feature\Setting;

use App\Models\Setting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class SettingsPageTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_receives_settings_and_image_urls_with_page(): void
    {
        $this->seed(\Database\Seeders\RoleSeeder::class);
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
}
