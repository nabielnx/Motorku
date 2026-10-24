<?php

declare(strict_types=1);

namespace Tests\Feature\Reference;

use App\Models\Category;
use App\Models\DataType;
use App\Models\Product;
use App\Models\ReferenceEntry;
use App\Models\User;
use App\Services\ReferenceService;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class DataTypeTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleSeeder::class);
        $owner = User::factory()->create();
        $owner->assignRole('owner');
        $this->actingAs($owner);
    }

    private function type(array $overrides = []): array
    {
        return [...['kind' => 'reference', 'name' => 'Elektronik', 'fields' => [
            ['key' => 'voltage', 'label' => 'Voltase', 'type' => 'number', 'required' => true, 'options' => []],
            ['key' => 'connection', 'label' => 'Koneksi', 'type' => 'select', 'required' => false, 'options' => ['USB', 'AC']],
            ['key' => 'portable', 'label' => 'Portabel', 'type' => 'boolean', 'required' => true, 'options' => []],
        ]], ...$overrides];
    }

    private function createType(array $overrides = []): array
    {
        return $this->postJson('/data-types', $this->type($overrides))->assertCreated()->json('data');
    }

    public function test_custom_product_types_work_in_navigation_categories_and_sheet_roundtrip(): void
    {
        $type = $this->createType(['kind' => 'product', 'name' => 'Peralatan Kebun', 'fields' => []]);
        $this->postJson('/api/categories', ['name' => 'Selang Kebun', 'catalog_group' => $type['key']])->assertCreated();
        $this->get('/products?group='.$type['key'])->assertOk()->assertInertia(fn ($page) => $page
            ->where('catalogGroups.'.$type['key'], 'Peralatan Kebun')
            ->where('catalog_groups.'.$type['key'], 'Peralatan Kebun'));

        $file = UploadedFile::fake()->createWithContent('kebun.csv', "Grup Barang,Kategori,Nama Barang,Harga Jual,Stok\nPeralatan Kebun,Selang Kebun,Selang 5m,50000,4\n");
        $draft = $this->post('/api/products/sheets/inspect', ['file' => $file], ['Accept' => 'application/json'])->assertOk()->json();
        $preview = $this->postJson('/api/products/sheets/preview', [
            'token' => $draft['token'], 'mode' => 'add', 'default_group' => $type['key'], 'use_estimated_cost' => false,
            'sheets' => [['id' => 0, 'mapping' => $draft['sheets'][0]['mapping']]],
        ])->assertOk()->json();
        $this->assertSame([], $preview['rows'][0]['errors']);
        $this->postJson('/api/products/sheets/commit', ['token' => $draft['token'], 'revision' => $preview['revision'], 'rows' => ['0:2']])->assertOk();
        $response = $this->get('/api/products/sheets/export?format=csv&group='.$type['key'])->assertOk();
        $path = $response->baseResponse->getFile()->getPathname();
        $this->assertStringContainsString('Peralatan Kebun', file_get_contents($path));
        @unlink($path);
        $this->deleteJson('/data-types/'.$type['id'])->assertUnprocessable();
    }

    public function test_custom_reference_type_validates_its_fields_and_maps_products_without_changing_stock(): void
    {
        $type = $this->createType();
        $product = Product::factory()->create(['stock' => 12]);
        $this->postJson('/references/'.$type['id'].'/entries', ['name' => 'Adaptor', 'schema_version' => 1, 'values' => ['voltage' => 220, 'connection' => 'AC', 'portable' => false], 'product_ids' => [$product->id]])->assertCreated();
        $entry = ReferenceEntry::sole();
        $this->assertSame(false, $entry->values['portable']);
        $this->assertSame($product->id, $entry->products()->sole()->id);
        $this->assertSame(12, $product->fresh()->stock);
        $this->get('/references/'.$type['id'])->assertOk()->assertInertia(fn ($page) => $page->component('Reference/Index')->has('entries.data', 1));
        foreach ([['portable' => false], ['voltage' => 'abc', 'portable' => false], ['voltage' => 220, 'portable' => false, 'connection' => 'INVALID'], ['voltage' => 220, 'portable' => false, 'injected' => 'x']] as $values) {
            $this->postJson('/references/'.$type['id'].'/entries', ['name' => 'Invalid', 'schema_version' => 1, 'values' => $values])->assertUnprocessable();
        }
        $this->assertSame(1, ReferenceEntry::count());
    }

    public function test_used_fields_are_not_removed_or_retyped_and_new_required_fields_need_existing_values(): void
    {
        $type = $this->createType();
        $this->postJson('/references/'.$type['id'].'/entries', ['name' => 'Adaptor', 'schema_version' => 1, 'values' => ['voltage' => 220, 'connection' => 'AC', 'portable' => false]])->assertCreated();
        $input = $this->type(['version' => 1]);
        $input['fields'] = array_slice($input['fields'], 1);
        $this->putJson('/data-types/'.$type['id'], $input)->assertUnprocessable();
        $input = $this->type(['version' => 1]);
        $input['fields'][0]['type'] = 'text';
        $this->putJson('/data-types/'.$type['id'], $input)->assertUnprocessable();
        $input = $this->type(['version' => 1]);
        $input['fields'][] = ['key' => 'power', 'label' => 'Daya', 'type' => 'number', 'required' => true, 'options' => []];
        $this->putJson('/data-types/'.$type['id'], $input)->assertUnprocessable();
        $input['fields'][3]['required'] = false;
        $this->putJson('/data-types/'.$type['id'], $input)->assertOk();
        $this->postJson('/references/'.$type['id'].'/entries', ['name' => 'Stale', 'schema_version' => 1, 'values' => ['voltage' => 220, 'portable' => true]])->assertUnprocessable();
        $this->putJson('/data-types/'.$type['id'], $input)->assertUnprocessable();
        $this->deleteJson('/data-types/'.$type['id'])->assertUnprocessable();
    }

    public function test_photos_are_physically_removed_and_entries_cannot_be_modified_through_another_type(): void
    {
        Storage::fake('public');
        $type = $this->createType(['fields' => []]);
        $entry = $this->post('/references/'.$type['id'].'/entries', ['name' => 'Adaptor', 'schema_version' => 1, 'image' => UploadedFile::fake()->image('adaptor.jpg')], ['Accept' => 'application/json'])->assertCreated()->json('data');
        Storage::disk('public')->assertExists($entry['image_path']);
        $this->putJson('/references/'.$type['id'].'/entries/'.$entry['id'], ['name' => 'Adaptor', 'schema_version' => 1, 'version' => 1, 'remove_image' => true])->assertOk();
        Storage::disk('public')->assertMissing($entry['image_path']);
        $other = $this->createType(['name' => 'Sepeda', 'fields' => []]);
        $this->deleteJson('/references/'.$other['id'].'/entries/'.$entry['id'])->assertNotFound();
        $this->deleteJson('/references/'.$type['id'].'/entries/'.$entry['id'])->assertOk();
    }

    public function test_builtin_motor_module_uses_its_driver_and_can_be_deleted_when_empty(): void
    {
        $motor = DataType::where('driver', 'motorcycles')->sole();
        $this->get('/references/'.$motor->id)->assertRedirect('/motorcycles');
        $this->postJson('/references/'.$motor->id.'/entries', ['name' => 'Invalid', 'schema_version' => 1])->assertNotFound();
        $this->putJson('/data-types/'.$motor->id, $this->type(['name' => 'Motor', 'version' => 1]))->assertUnprocessable();
        $this->assertSame(4, DataType::where('kind', 'product')->count());
        $this->deleteJson('/data-types/'.$motor->id)->assertOk();
        $this->assertDatabaseMissing('data_types', ['id' => $motor->id]);
    }

    public function test_cleanup_failure_does_not_delete_a_newly_saved_photo(): void
    {
        $disk = Storage::fake('public');
        $type = DataType::findOrFail($this->createType(['fields' => []])['id']);
        $oldPath = 'references/previous.webp';
        $disk->put($oldPath, 'old image');
        $entry = $type->entries()->create(['name' => 'Adaptor', 'values' => [], 'image_path' => $oldPath]);
        $failingDisk = \Mockery::mock($disk);
        $failingDisk->shouldReceive('delete')->with($oldPath)->once()->andThrow(new \RuntimeException('Cleanup failed'));
        Storage::shouldReceive('disk')->with('public')->andReturn($failingDisk);

        try {
            app(ReferenceService::class)->save($type, [
                'name' => 'Adaptor', 'schema_version' => 1, 'version' => 1,
                'image' => UploadedFile::fake()->image('replacement.jpg'),
            ], $entry);
            $this->fail('Expected the simulated cleanup failure.');
        } catch (\RuntimeException $exception) {
            $this->assertSame('Cleanup failed', $exception->getMessage());
        }

        $newPath = $entry->fresh()->image_path;
        $this->assertNotSame($oldPath, $newPath);
        $disk->assertExists($newPath);
    }

    public function test_guests_cashiers_and_unverified_users_cannot_manage_types_or_reference_entries(): void
    {
        $type = $this->createType(['fields' => []]);
        $cashier = User::factory()->create();
        $cashier->assignRole('cashier');
        $this->actingAs($cashier)->get('/data-types')->assertForbidden();
        $this->postJson('/data-types', $this->type())->assertForbidden();
        $this->get('/references/'.$type['id'])->assertForbidden();
        $this->getJson('/references/'.$type['id'].'/products')->assertForbidden();
        $this->postJson('/references/'.$type['id'].'/entries', ['name' => 'X', 'schema_version' => 1])->assertForbidden();
        $cashier->forceFill(['email_verified_at' => null])->save();
        $this->actingAs($cashier->fresh())->getJson('/data-types')->assertForbidden();
        auth()->logout();
        $this->postJson('/data-types', $this->type())->assertUnauthorized();
    }

    public function test_schema_keys_driver_kind_and_duplicate_names_are_protected(): void
    {
        $type = $this->createType();
        $this->postJson('/data-types', $this->type())->assertUnprocessable();
        foreach (['bad.key', 'constructor', 'prototype', 'items[0]'] as $key) {
            $input = $this->type(['name' => 'Invalid']);
            $input['fields'][0]['key'] = $key;
            $this->postJson('/data-types', $input)->assertUnprocessable();
        }
        $this->postJson('/data-types', $this->type(['name' => 'Invalid', 'driver' => 'motorcycles']))->assertUnprocessable();
        $input = $this->type(['name' => 'Invalid']);
        $input['fields'][1]['options'] = ['AC', 'AC'];
        $this->postJson('/data-types', $input)->assertUnprocessable();
        $this->putJson('/data-types/'.$type['id'], $this->type(['kind' => 'product', 'version' => 1, 'fields' => []]))->assertUnprocessable();
        $this->postJson('/data-types', $this->type(['kind' => 'product', 'name' => 'Otomotif', 'fields' => []]))->assertUnprocessable();
        $this->assertSame('reference', DataType::findOrFail($type['id'])->kind);
    }

    public function test_renaming_types_labels_and_field_order_preserves_keys_values_and_links(): void
    {
        $type = $this->createType();
        $product = Product::factory()->create();
        $entry = $this->postJson('/references/'.$type['id'].'/entries', ['name' => 'Adaptor', 'schema_version' => 1, 'values' => ['voltage' => 0, 'connection' => 'AC', 'portable' => false], 'product_ids' => [$product->id]])->assertCreated()->json('data');
        $input = $this->type(['version' => 1, 'name' => 'Perangkat Elektronik']);
        $input['fields'][0]['label'] = 'Tegangan';
        $input['fields'] = array_reverse($input['fields']);
        $this->putJson('/data-types/'.$type['id'], $input)->assertOk();
        $stored = ReferenceEntry::findOrFail($entry['id']);
        $this->assertSame(0, $stored->values['voltage']);
        $this->assertSame($product->id, $stored->products()->sole()->id);
        $this->assertSame($type['key'], $stored->dataType->key);
        $input['version'] = 2;
        $input['fields'][1]['options'] = ['USB'];
        $this->putJson('/data-types/'.$type['id'], $input)->assertUnprocessable();
        $this->assertSame('AC', $stored->fresh()->values['connection']);
    }

    public function test_entry_updates_reject_stale_versions_and_mapping_can_be_cleared(): void
    {
        $type = $this->createType(['fields' => []]);
        $product = Product::factory()->create();
        $entry = $this->postJson('/references/'.$type['id'].'/entries', ['name' => 'Adaptor', 'schema_version' => 1, 'product_ids' => [$product->id]])->assertCreated()->json('data');
        $input = ['name' => 'Adaptor baru', 'schema_version' => 1, 'version' => 1, 'product_ids' => []];
        $this->putJson('/references/'.$type['id'].'/entries/'.$entry['id'], $input)->assertOk();
        $this->putJson('/references/'.$type['id'].'/entries/'.$entry['id'], [...$input, 'name' => 'Stale'])->assertUnprocessable();
        $this->assertSame('Adaptor baru', ReferenceEntry::findOrFail($entry['id'])->name);
        $this->assertSame(0, ReferenceEntry::findOrFail($entry['id'])->products()->count());
    }

    public function test_lookup_is_paginated_and_mapping_rejects_nonexistent_and_duplicate_products(): void
    {
        $type = $this->createType(['fields' => []]);
        $category = Category::factory()->create();
        Product::factory()->count(24)->create(['category_id' => $category->id]);
        $lookup = $this->getJson('/references/'.$type['id'].'/products')->assertOk();
        $lookup->assertJsonCount(20, 'data.data')->assertJsonPath('data.total', 24);
        $product = Product::first();
        $input = ['name' => 'Adaptor', 'schema_version' => 1];
        $this->postJson('/references/'.$type['id'].'/entries', [...$input, 'product_ids' => [$product->id, $product->id]])->assertUnprocessable();
        $this->postJson('/references/'.$type['id'].'/entries', [...$input, 'product_ids' => ['00000000-0000-4000-8000-000000000001']])->assertUnprocessable();
        $this->getJson('/references/'.$type['id'].'/products?search='.str_repeat('a', 101))->assertUnprocessable();
        $this->assertSame(0, ReferenceEntry::count());
    }

    public function test_empty_custom_types_can_be_deleted_and_renaming_product_group_keeps_category_identity(): void
    {
        $type = $this->createType(['kind' => 'product', 'name' => 'Kebun', 'fields' => []]);
        $this->deleteJson('/data-types/'.$type['id'])->assertOk();
        $this->assertDatabaseMissing('data_types', ['id' => $type['id']]);
        $preset = DataType::where('kind', 'product')->where('key', 'automotive')->sole();
        $category = Category::factory()->create(['catalog_group' => 'automotive']);
        $this->putJson('/data-types/'.$preset->id, ['kind' => 'product', 'name' => 'Suku Cadang Motor', 'version' => 1, 'fields' => []])->assertOk();
        $this->assertSame('automotive', $category->fresh()->catalog_group);
        $this->get('/products?group=automotive')->assertOk()->assertInertia(fn ($page) => $page->where('catalog_groups.automotive', 'Suku Cadang Motor'));
    }
}
