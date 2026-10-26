<?php

declare(strict_types=1);

namespace Tests\Feature\Business;

use App\Models\Business;
use App\Models\CustomerAccount;
use App\Models\Product;
use App\Models\User;
use App\Services\BusinessContext;
use App\Services\BusinessOnboardingService;
use App\Services\SettingService;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

final class StoreEntryTest extends TestCase
{
    use RefreshDatabase;

    public function test_root_is_neutral_even_with_default_store_data_and_an_authenticated_owner(): void
    {
        $this->seed(RoleSeeder::class);
        $owner = User::factory()->create();
        $owner->assignRole('owner');
        app(SettingService::class)->upsertSetting('store', 'name', 'Nama Toko Rahasia Lama');
        app(SettingService::class)->upsertSetting('store', 'logo', 'business/secret-logo.webp');
        Product::factory()->create(['name' => 'Barang toko lama']);

        $this->actingAs($owner)->get('/')->assertOk()->assertInertia(fn ($page) => $page
            ->component('Store/Entry')->where('business', null)->where('shop_slug', null)
            ->where('logo_url', null)->where('app_settings.store_name', 'TokoM')
            ->where('catalog_groups', [])->where('reference_modules', [])
            ->missing('initialProducts')->missing('settings'));
        $this->get('/')->assertSee('Buka toko pilihanmu')->assertDontSee('Nama Toko Rahasia Lama')->assertDontSee('Barang toko lama');
    }

    public function test_missing_store_is_rejected_before_catalog_reads_order_writes_and_stock_mutations(): void
    {
        $product = Product::factory()->create(['stock' => 10]);
        $id = (string) Str::uuid();
        foreach (['/catalog/products', '/payment', '/order/waiting', '/order/status', '/motor-saya', '/api/motor-saya/'.$id.'/parts', '/customer/orders', '/api/customer/order/'.$id.'/status'] as $path) {
            $this->getJson($path)->assertNotFound();
        }
        foreach (['/api/customer/order', '/customer/checkout', '/api/customer/order/'.$id.'/cancel', '/api/customer/order/'.$id.'/qris', '/api/customer/order/'.$id.'/payment-review'] as $path) {
            $this->postJson($path, ['customer_name' => 'Pelanggan', 'items' => [['product_id' => $product->id, 'quantity' => 1]], 'customer_token' => str_repeat('a', 64)])->assertNotFound();
        }
        $this->assertSame(10, $product->fresh()->stock);
        $this->assertDatabaseCount('orders', 0);
        $this->assertDatabaseCount('inventory_logs', 0);
    }

    public function test_platform_sign_in_and_registration_do_not_inherit_default_store_settings(): void
    {
        app(SettingService::class)->upsertSetting('store', 'name', 'Nama Toko Lama');
        foreach (['/login', '/register'] as $path) {
            $this->get($path)->assertOk()->assertInertia(fn ($page) => $page
                ->where('business', null)->where('shop_slug', null)->where('catalog_groups', [])
                ->where('app_settings.store_name', 'TokoM'));
        }
    }

    public function test_explicit_store_links_work_and_query_links_redirect_to_the_canonical_store_address(): void
    {
        $product = Product::factory()->create();
        $this->get('/s/toko-utama')->assertOk()->assertInertia(fn ($page) => $page
            ->component('Order/Menu')->where('shop_slug', 'toko-utama')->where('initialProducts.0.id', $product->id));
        $this->get('/?shop=toko-utama')->assertRedirect('/s/toko-utama');
        $this->getJson('/catalog/products?shop=toko-utama')->assertOk()->assertJsonPath('data.products.0.id', $product->id);
        foreach (['/?shop=missing-store', '/s/missing-store', '/?shop[]=toko-utama', '/catalog/products?shop=', '/sitemap.xml?shop=missing-store'] as $path) {
            $this->get($path)->assertNotFound();
        }
        Business::where('slug', 'toko-utama')->update(['activated_at' => null]);
        $this->get('/s/toko-utama')->assertNotFound();
    }

    public function test_unscoped_manifest_and_sitemap_do_not_inherit_default_store_data(): void
    {
        DB::table('businesses')->where('id', BusinessContext::LEGACY_ID)->update(['name' => 'Nama Toko Lama']);
        $this->getJson('/pwa/manifest')->assertOk()->assertJsonPath('name', 'TokoM')->assertJsonPath('start_url', '/');
        $this->getJson('/pwa/manifest?shop=toko-utama')->assertOk()->assertJsonPath('name', 'Nama Toko Lama')->assertJsonPath('start_url', '/s/toko-utama');
        $sitemap = $this->get('/sitemap.xml')->assertOk()->assertDontSee('/motor-saya');
        $this->assertCount(1, simplexml_load_string($sitemap->getContent())->url);
    }

    public function test_customer_profile_remains_global_without_a_default_store(): void
    {
        $customer = CustomerAccount::create(['name' => 'Pembeli', 'email' => 'customer@example.test', 'password' => 'Strong@1234']);
        $this->get('/customer/login?return=/payment')->assertOk();
        $this->post('/customer/login', ['email' => $customer->email, 'password' => 'Strong@1234'])->assertRedirect('/customer/account');
        $this->get('/customer/account')->assertOk()->assertInertia(fn ($page) => $page
            ->where('customer.id', $customer->id)->where('business', null)->where('catalog_groups', []));
        $this->patch('/customer/account', ['name' => 'Pembeli Baru', 'phone' => '081234567890', 'address' => 'Demak'])->assertRedirect();
        $this->assertSame('Demak', $customer->fresh()->address);
    }

    public function test_admin_settings_share_the_owner_store_link_and_ignore_public_shop_parameters(): void
    {
        $this->seed(RoleSeeder::class);
        $owner = app(BusinessOnboardingService::class)->register([
            'name' => 'Owner B', 'email' => 'owner-b@example.test', 'business_name' => 'Toko B',
            'business_slug' => 'toko-b', 'password' => 'Strong@1234',
        ], ['id' => 'google-b', 'email' => 'owner-b@example.test', 'trusted_email' => true]);
        $this->actingAs($owner)->get('/settings?shop=toko-utama')->assertOk()->assertInertia(fn ($page) => $page
            ->where('business.id', $owner->business_id)->where('business.public_url', url('/s/toko-b')));
        $this->get('/s/toko-utama?shop=toko-b')->assertOk()->assertInertia(fn ($page) => $page
            ->where('shop_slug', 'toko-utama')->where('business.id', BusinessContext::LEGACY_ID)->where('auth.user', null));
    }
}
