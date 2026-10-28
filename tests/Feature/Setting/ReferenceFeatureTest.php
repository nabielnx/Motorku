<?php

declare(strict_types=1);

namespace Tests\Feature\Setting;

use App\Models\Business;
use App\Models\DataType;
use App\Models\Motorcycle;
use App\Models\MotorcyclePart;
use App\Models\Product;
use App\Models\Setting;
use App\Models\User;
use App\Services\BusinessContext;
use App\Services\SettingService;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReferenceFeatureTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleSeeder::class);
    }

    private function owner(): User
    {
        $owner = User::factory()->create();
        $owner->assignRole('owner');

        return $owner;
    }

    private function toggle(string $enabled, string $key = 'enabled')
    {
        return $this->postJson('/api/settings', ['settings' => [['group' => 'references', 'key' => $key, 'value' => $enabled]]]);
    }

    private function reference(): DataType
    {
        return DataType::create(['kind' => 'reference', 'key' => 'electronics', 'name' => 'Elektronik', 'fields' => []]);
    }

    public function test_existing_stores_default_to_enabled_without_a_new_setting(): void
    {
        $this->assertTrue(app(SettingService::class)->referencesEnabled());
        $this->get($this->storeUrl('/'))->assertInertia(fn ($page) => $page->where('app_settings.references_enabled', true));
        $this->get($this->storeUrl('/motor-saya'))->assertOk();
        $this->actingAs($this->owner())->get('/motorcycles')->assertOk();
    }

    public function test_owner_can_toggle_immediately_and_shared_navigation_cache_refreshes(): void
    {
        $reference = $this->reference();
        $this->actingAs($this->owner());
        $this->get('/settings')->assertInertia(fn ($page) => $page->where('reference_modules', fn ($modules) => collect($modules)->contains('key', $reference->key)));
        $this->toggle('false')->assertOk();
        $this->get('/settings')->assertInertia(fn ($page) => $page
            ->where('initialSettings.references_enabled', 'false')
            ->where('app_settings.references_enabled', false)->where('reference_modules', fn ($modules) => ! collect($modules)->contains('key', $reference->key)));
        $this->get($this->storeUrl('/'))->assertInertia(fn ($page) => $page
            ->where('app_settings.references_enabled', false)->where('settings', fn ($settings) => ($settings['references.enabled'] ?? null) === 'false'));
        $this->get($this->storeUrl('/payment'))->assertInertia(fn ($page) => $page->where('app_settings.references_enabled', false));
        $this->toggle('true')->assertOk();
        $this->get('/settings')->assertInertia(fn ($page) => $page
            ->where('app_settings.references_enabled', true)->where('reference_modules', fn ($modules) => collect($modules)->contains('key', $reference->key)));
    }

    public function test_disabled_motor_blocks_management_but_preserves_data_and_other_reference_management(): void
    {
        $reference = $this->reference();
        $entry = $reference->entries()->create(['name' => 'Adaptor QA', 'values' => []]);
        $motorcycle = Motorcycle::create(['year_start' => 2025, 'engine_cc' => 110, 'brand' => 'Honda', 'model' => 'QA Motor', 'slug' => 'qa-motor']);
        $product = Product::factory()->create(['stock' => 9]);
        MotorcyclePart::create(['motorcycle_id' => $motorcycle->id, 'product_id' => $product->id, 'part_category' => 'oli']);
        $this->actingAs($this->owner());
        $this->toggle('false')->assertOk();
        $this->toggle('false', 'motorcycles_enabled')->assertOk();
        $this->get($this->storeUrl('/motor-saya'))->assertRedirect('/s/toko-utama');
        $this->get($this->storeUrl('/motor-saya/qa-motor'))->assertRedirect('/s/toko-utama');
        $this->get('/motorcycles')->assertForbidden();
        $this->get('/data-types?kind=reference')->assertOk();
        $this->get('/references/'.$reference->id)->assertOk();
        $this->getJson($this->storeUrl('/api/motor-saya/'.$motorcycle->id.'/parts'))->assertForbidden();
        $this->getJson('/motorcycles/'.$motorcycle->id.'/parts')->assertForbidden();
        $this->getJson('/references/'.$reference->id.'/products')->assertOk();
        $this->postJson('/references/'.$reference->id.'/entries', ['name' => 'Other', 'schema_version' => 1, 'values' => []])->assertCreated();
        $this->assertDatabaseHas('reference_entries', ['id' => $entry->id]);
        $this->assertSame(9, $product->fresh()->stock);
        $this->assertSame($product->id, $motorcycle->products()->sole()->id);
        $this->toggle('true')->assertOk();
        $this->toggle('true', 'motorcycles_enabled')->assertOk();
        $this->get($this->storeUrl('/motor-saya/qa-motor'))->assertOk();
        $this->get('/references/'.$reference->id)->assertOk();
        $this->getJson($this->storeUrl('/api/motor-saya/'.$motorcycle->id.'/parts'))->assertOk();
    }

    public function test_both_admin_type_kinds_remain_editable_but_kind_changes_are_rejected(): void
    {
        $reference = $this->reference();
        $this->actingAs($this->owner());
        $this->toggle('false')->assertOk();
        $this->get('/data-types?kind=product')->assertOk();
        $input = ['kind' => 'product', 'name' => 'Peralatan QA', 'fields' => []];
        $id = $this->postJson('/data-types', $input)->assertCreated()->json('data.id');
        $this->putJson('/data-types/'.$id, [...$input, 'version' => 1, 'name' => 'Peralatan QA Baru'])->assertOk();
        $this->postJson('/data-types', ['kind' => 'reference', 'name' => 'Hidden', 'fields' => []])->assertCreated()->assertJsonPath('data.is_public', false);
        $this->putJson('/data-types/'.$reference->id, [...$input, 'version' => 1])->assertUnprocessable();
        $this->assertDatabaseHas('data_types', ['id' => $reference->id]);
        $this->get('/products')->assertOk();
        $this->get('/pos')->assertOk();
    }

    public function test_sitemap_excludes_disabled_motor_links_and_restores_them_when_enabled(): void
    {
        Motorcycle::create(['year_start' => 2025, 'engine_cc' => 110, 'brand' => 'Honda', 'model' => 'Sitemap QA', 'slug' => 'sitemap-qa']);
        $this->get($this->storeUrl('/sitemap.xml'))->assertOk()->assertSee('motor-saya/sitemap-qa');
        $this->actingAs($this->owner());
        $this->toggle('false', 'motorcycles_enabled')->assertOk();
        $this->get($this->storeUrl('/sitemap.xml'))->assertOk()->assertDontSee('motor-saya');
        $this->toggle('true', 'motorcycles_enabled')->assertOk();
        $this->get($this->storeUrl('/sitemap.xml'))->assertOk()->assertSee('motor-saya/sitemap-qa');
    }

    public function test_guest_and_cashier_cannot_toggle_and_invalid_values_do_not_change_the_flag(): void
    {
        $this->toggle('false')->assertUnauthorized();
        $cashier = User::factory()->create();
        $cashier->assignRole('cashier');
        $this->actingAs($cashier);
        $this->toggle('false')->assertForbidden();
        $this->get('/settings')->assertForbidden();
        $this->actingAs($this->owner());
        $this->toggle('off')->assertUnprocessable()->assertJsonValidationErrors('settings.0.value');
        $this->assertTrue(app(SettingService::class)->referencesEnabled());
    }

    public function test_disabling_one_business_does_not_change_another_and_old_store_urls_stay_in_their_store(): void
    {
        $other = Business::create(['name' => 'Other Shop QA', 'slug' => 'other-shop-qa', 'activated_at' => now()]);
        $other->forceFill(['activated_at' => now()])->save();
        app(BusinessContext::class)->run($other->id, function () {
            $type = DataType::create(['kind' => 'reference', 'key' => 'motor', 'name' => 'Motor', 'fields' => [], 'is_public' => true]);
            $type->forceFill(['driver' => 'motorcycles'])->save();
            app(SettingService::class)->saveAll([['group' => 'references', 'key' => 'motorcycles_enabled', 'value' => 'true']]);
        });
        $this->actingAs($this->owner());
        $this->toggle('false')->assertOk();
        $this->get('/s/other-shop-qa')->assertInertia(fn ($page) => $page->where('app_settings.references_enabled', true));
        $this->get($this->storeUrl('/motor-saya?shop=other-shop-qa'))->assertOk();
        app(BusinessContext::class)->run($other->id, fn () => app(SettingService::class)->saveAll([
            ['group' => 'references', 'key' => 'enabled', 'value' => 'false'],
            ['group' => 'references', 'key' => 'motorcycles_enabled', 'value' => 'false'],
        ]));
        $this->get($this->storeUrl('/motor-saya?shop=other-shop-qa'))->assertRedirect('/s/other-shop-qa');
        $this->toggle('true')->assertOk();
        $this->get('/s/other-shop-qa')->assertInertia(fn ($page) => $page->where('app_settings.references_enabled', false));
        $this->assertSame('true', Setting::where('group', 'references')->where('key', 'enabled')->value('value'));
    }
}
