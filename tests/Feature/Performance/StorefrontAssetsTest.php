<?php

declare(strict_types=1);

namespace Tests\Feature\Performance;

use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Vite;
use Tests\TestCase;

final class StorefrontAssetsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // Inspect the production manifest even when the developer has Vite running.
        Vite::useHotFile(storage_path('framework/testing-storefront-assets.hot'));
    }

    private function adminCss(): string
    {
        $manifest = json_decode(file_get_contents(public_path('build/manifest.json')), true, 512, JSON_THROW_ON_ERROR);

        return $manifest['resources/css/admin.css']['file'];
    }

    public function test_customer_html_does_not_load_admin_styles_even_when_an_owner_is_signed_in(): void
    {
        $this->seed(RoleSeeder::class);
        $owner = User::factory()->create();
        $owner->assignRole('owner');
        $this->actingAs($owner)->get('/s/toko-utama')->assertOk()->assertDontSee($this->adminCss(), false);
    }

    public function test_admin_html_includes_its_stylesheet_before_the_initial_skeleton(): void
    {
        $this->seed(RoleSeeder::class);
        $owner = User::factory()->create();
        $owner->assignRole('owner');
        $html = $this->actingAs($owner)->get('/dashboard')->assertOk()->getContent();
        $stylesheet = strpos($html, $this->adminCss());
        $this->assertNotFalse($stylesheet);
        $this->assertLessThan(strpos($html, '</head>'), $stylesheet);
        $this->assertStringContainsString('admin-workspace', $html);
    }
}
