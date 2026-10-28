<?php

declare(strict_types=1);

namespace Tests\Feature\Reference;

use App\Models\Business;
use App\Models\Category;
use App\Models\DataType;
use App\Models\Motorcycle;
use App\Models\MotorcyclePart;
use App\Models\Product;
use App\Models\User;
use App\Services\BusinessContext;
use App\Services\SettingService;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class PublicReferenceFinderTest extends TestCase
{
    use RefreshDatabase;

    private function type(array $attributes = []): DataType
    {
        return DataType::create([...['kind' => 'reference', 'name' => 'Elektronik', 'key' => 'electronics', 'fields' => []], ...$attributes]);
    }

    private function url(?DataType $type = null, ?string $entry = null): string
    {
        return $this->storeUrl('/cari-kecocokan'.($type ? '/'.$type->id : '').($entry ? '/'.$entry : ''));
    }

    public function test_custom_types_are_private_until_owner_publishes_them_and_can_be_hidden_again(): void
    {
        $this->seed(RoleSeeder::class);
        $owner = User::factory()->create();
        $owner->assignRole('owner');
        $type = $this->type();
        $this->assertFalse($type->is_public);
        $this->get($this->url($type))->assertNotFound();
        $this->actingAs($owner);
        $input = ['kind' => 'reference', 'name' => $type->name, 'fields' => [], 'is_public' => true, 'version' => 1];
        $this->putJson('/data-types/'.$type->id, $input)->assertOk();
        $this->get($this->url())->assertInertia(fn ($page) => $page->where('types', fn ($types) => collect($types)->contains('id', $type->id)));
        $this->get($this->url($type))->assertOk();
        $this->putJson('/data-types/'.$type->id, [...$input, 'is_public' => false, 'version' => 2])->assertOk();
        $this->get($this->url($type))->assertNotFound();
        $this->postJson('/data-types', ['kind' => 'product', 'name' => 'Invalid', 'fields' => [], 'is_public' => true])->assertUnprocessable();
        $cashier = User::factory()->create();
        $cashier->assignRole('cashier');
        $this->actingAs($cashier)->putJson('/data-types/'.$type->id, [...$input, 'version' => 3])->assertForbidden();
    }

    public function test_only_available_mapped_products_and_public_fields_are_returned(): void
    {
        $type = $this->type(['is_public' => true, 'fields' => [['key' => 'internal', 'label' => 'Secret schema', 'type' => 'text', 'required' => false, 'options' => []]]]);
        $entry = $type->entries()->create(['name' => 'Adaptor USB', 'description' => 'Private reference description', 'values' => ['internal' => 'Supplier secret']]);
        $product = Product::factory()->create(['is_available' => true, 'cost_price' => 123456, 'description' => 'Private product description']);
        $hidden = Product::factory()->create(['is_available' => false]);
        $unrelated = Product::factory()->create(['is_available' => true]);
        $entry->products()->attach([$product->id => ['id' => (string) Str::uuid()], $hidden->id => ['id' => (string) Str::uuid()]]);
        $response = $this->get($this->url($type, $entry->id))->assertOk()->assertInertia(fn ($page) => $page
            ->component('Reference/Finder')->where('selectedEntry.name', 'Adaptor USB')
            ->has('products.data', 1)->where('products.data.0.id', $product->id)
            ->missing('products.data.0.cost_price')->missing('products.data.0.pivot')
            ->missing('selectedEntry.values')->missing('selectedType.fields'));
        foreach (['Private reference description', 'Supplier secret', 'Secret schema', 'Private product description', $hidden->id, $unrelated->id] as $secret) {
            $response->assertDontSee($secret);
        }
        $this->get($this->url($type))->assertInertia(fn ($page) => $page->where('entries.data.0.products_count', 1)->missing('entries.data.0.values'));
        $this->assertStringContainsString('no-store', $response->headers->get('Cache-Control'));
    }

    public function test_store_and_type_boundaries_are_enforced_even_for_direct_urls(): void
    {
        $type = $this->type(['is_public' => true]);
        $entry = $type->entries()->create(['name' => 'Own entry', 'values' => []]);
        $differentType = $this->type(['name' => 'Sepeda', 'key' => 'bikes', 'is_public' => true]);
        $this->get($this->url($differentType, $entry->id))->assertNotFound();
        $this->get('/cari-kecocokan')->assertNotFound();
        $other = Business::create(['name' => 'Other', 'slug' => 'other-reference-shop']);
        $other->forceFill(['activated_at' => now()])->save();
        $foreign = app(BusinessContext::class)->run($other->id, fn () => $this->type(['is_public' => true]));
        $this->get($this->url($foreign))->assertNotFound();
        $this->get('/cari-kecocokan/'.$type->id.'?shop='.$other->slug)->assertNotFound();
        $this->get('/cari-kecocokan?shop='.$other->slug)->assertInertia(fn ($page) => $page->has('types', 1)->where('types.0.id', $foreign->id));
    }

    public function test_entry_and_product_lists_are_paginated_and_search_is_literal(): void
    {
        $type = $this->type(['is_public' => true]);
        foreach (range(1, 13) as $i) {
            $type->entries()->create(['name' => sprintf('Entry %02d', $i), 'values' => []]);
        }
        $entry = $type->entries()->first();
        $category = Category::factory()->create();
        foreach (Product::factory()->count(13)->create(['is_available' => true, 'category_id' => $category->id]) as $product) {
            $entry->products()->attach($product->id, ['id' => (string) Str::uuid()]);
        }
        $this->get($this->url($type))->assertInertia(fn ($page) => $page->has('entries.data', 12)->where('entries.total', 13)->where('entries.last_page', 2));
        $this->get($this->url($type).'&page=2')->assertInertia(fn ($page) => $page->has('entries.data', 1));
        $this->get($this->url($type).'&search=Entry%2003')->assertInertia(fn ($page) => $page->has('entries.data', 1)->where('entries.data.0.name', 'Entry 03'));
        $this->get($this->url($type).'&search=%25')->assertInertia(fn ($page) => $page->has('entries.data', 0));
        $this->get($this->url($type, $entry->id))->assertInertia(fn ($page) => $page->has('products.data', 12)->where('products.total', 13));
        $this->getJson($this->url($type).'&search='.str_repeat('a', 101))->assertUnprocessable();
    }

    public function test_global_toggle_and_motor_visibility_apply_to_legacy_links_and_catalog_payloads(): void
    {
        $motor = DataType::where('driver', 'motorcycles')->sole();
        $this->assertTrue($motor->is_public);
        $this->get($this->url($motor))->assertRedirect('/motor-saya?shop=toko-utama');
        $motorcycle = Motorcycle::create(['year_start' => 2025, 'engine_cc' => 110, 'brand' => 'Honda', 'model' => 'Reference QA', 'slug' => 'reference-qa']);
        $product = Product::factory()->create(['is_available' => true]);
        MotorcyclePart::create(['motorcycle_id' => $motorcycle->id, 'product_id' => $product->id, 'part_category' => 'oli']);
        app(SettingService::class)->saveAll([['group' => 'references', 'key' => 'motorcycles_enabled', 'value' => 'false']]);
        $this->get($this->storeUrl('/motor-saya'))->assertRedirect('/s/toko-utama');
        $this->get($this->storeUrl('/'))->assertInertia(fn ($page) => $page->where('app_settings.motorcycle_references_enabled', false));
        $this->getJson($this->storeUrl('/catalog/products'))->assertOk()->assertJsonPath('data.products.0.motorcycles', []);
        $this->getJson($this->storeUrl('/catalog/products?search=Reference%20QA'))->assertOk()->assertJsonCount(0, 'data.products');
        $this->seed(RoleSeeder::class);
        $owner = User::factory()->create();
        $owner->assignRole('owner');
        $this->actingAs($owner)->get('/pos')->assertInertia(fn ($page) => $page->where('initialProducts.0.motorcycles.0.id', $motorcycle->id));
        $this->get($this->storeUrl('/sitemap.xml'))->assertDontSee('motor-saya');
        $this->get($this->url($motor))->assertNotFound();
        app(SettingService::class)->saveAll([['group' => 'references', 'key' => 'enabled', 'value' => 'false']]);
        $this->get($this->url())->assertRedirect('/s/toko-utama');
        $this->getJson($this->url())->assertForbidden();
    }

    public function test_ordering_disabled_store_exposes_no_reference_entries(): void
    {
        $type = $this->type(['is_public' => true]);
        $entry = $type->entries()->create(['name' => 'Private while closed', 'values' => []]);
        app(SettingService::class)->saveAll([['group' => 'qr_order', 'key' => 'enabled', 'value' => 'false']]);
        $this->get($this->url($type, $entry->id))->assertInertia(fn ($page) => $page->where('types', [])->where('selectedEntry', null)->where('products', null)->where('public_reference_modules', []));
    }
}
