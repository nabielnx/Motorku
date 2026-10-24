<?php

declare(strict_types=1);

namespace Tests\Feature\Setting;

use App\Http\Middleware\ControlAdminDeletion;
use App\Models\Category;
use App\Models\DataType;
use App\Models\Motorcycle;
use App\Models\MotorcyclePart;
use App\Models\Order;
use App\Models\Product;
use App\Models\Setting;
use App\Models\Supplier;
use App\Models\User;
use App\Services\CacheService;
use App\Services\DeletionControlService;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AdminDeletionControlTest extends TestCase
{
    use RefreshDatabase;

    private User $owner;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleSeeder::class);
        Storage::fake('public');
        $this->owner = User::factory()->create();
        $this->owner->assignRole('owner');
        $this->actingAs($this->owner);
    }

    private function setDeletion(bool $enabled): void
    {
        $this->postJson('/api/settings', ['settings' => [
            ['group' => 'system', 'key' => 'deletion_enabled', 'value' => $enabled ? 'true' : 'false'],
        ]])->assertOk();
    }

    private function type(): DataType
    {
        return DataType::create(['kind' => 'reference', 'key' => 'qa_reference', 'name' => 'Referensi QA', 'fields' => []]);
    }

    private function motor(): Motorcycle
    {
        return Motorcycle::create(['brand' => 'Honda', 'model' => 'QA Motor', 'slug' => 'qa-motor', 'year_start' => 2020,
            'engine_cc' => 110, 'engine_type' => 'matic', 'image_url' => '/storage/motorcycles/qa.webp']);
    }

    public function test_existing_installations_default_to_enabled_and_owner_can_toggle_with_immediate_shared_props(): void
    {
        $this->get('/data-types')->assertInertia(fn (Assert $page) => $page->where('app_settings.deletion_enabled', true));
        $this->assertTrue(app(DeletionControlService::class)->enabled());
        $this->setDeletion(false);
        $this->get('/settings')->assertInertia(fn (Assert $page) => $page->where('initialSettings.system_deletion_enabled', 'false')->where('app_settings.deletion_enabled', false));
        $this->get('/suppliers')->assertInertia(fn (Assert $page) => $page->where('app_settings.deletion_enabled', false));
        $this->setDeletion(true);
        $this->get('/data-types')->assertInertia(fn (Assert $page) => $page->where('app_settings.deletion_enabled', true));
        $this->assertTrue(app(DeletionControlService::class)->enabled());
    }

    public function test_locked_setting_blocks_all_admin_record_deletions_and_preserves_rows_files_and_mappings(): void
    {
        $product = Product::factory()->create(['image_path' => 'products/qa.webp']);
        $supplier = Supplier::create(['name' => 'Supplier QA']);
        $staff = User::factory()->create();
        $staff->assignRole('cashier');
        $order = Order::factory()->create();
        $type = $this->type();
        $entry = $type->entries()->create(['name' => 'Referensi QA', 'values' => [], 'image_path' => 'references/qa.webp']);
        $entry->products()->attach($product->id, ['id' => fake()->uuid()]);
        $motor = $this->motor();
        $part = MotorcyclePart::create(['motorcycle_id' => $motor->id, 'product_id' => $product->id, 'part_category' => 'lainnya']);
        foreach (['products/qa.webp', 'references/qa.webp', 'motorcycles/qa.webp'] as $path) {
            Storage::disk('public')->put($path, 'qa');
        }
        $emptyPreset = DataType::where('kind', 'product')->where('key', 'electronics')->sole();
        $this->setDeletion(false);
        foreach ([
            '/api/products/'.$product->id, '/api/categories/'.$product->category_id, '/api/orders/'.$order->id,
            '/api/inventory/'.fake()->uuid(), '/api/users/'.$staff->id, '/suppliers/'.$supplier->id,
            '/data-types/'.$emptyPreset->id, '/references/'.$type->id.'/entries/'.$entry->id,
            '/motorcycles/'.$motor->id, '/motorcycles/'.$motor->id.'/parts/'.$part->id,
            '/profile/avatar', '/profile',
        ] as $url) {
            $this->deleteJson($url)->assertForbidden()->assertJsonPath('message', DeletionControlService::MESSAGE);
        }
        foreach ([$product, $supplier, $staff, $order, $entry, $motor, $part, $emptyPreset] as $record) {
            $this->assertNotNull($record->fresh());
        }
        $this->assertDatabaseHas('reference_entry_product', ['reference_entry_id' => $entry->id, 'product_id' => $product->id]);
        Storage::disk('public')->assertExists(['products/qa.webp', 'references/qa.webp', 'motorcycles/qa.webp']);
    }

    public function test_image_delete_endpoints_and_remove_image_updates_cannot_bypass_the_lock(): void
    {
        foreach (['logo', 'qris_image', 'login_image', 'promo_banner_1'] as $key) {
            $path = 'qa/'.$key.'.webp';
            Storage::disk('public')->put($path, 'qa');
            Setting::create(['group' => 'store', 'key' => $key, 'value' => $path]);
        }
        $this->setDeletion(false);
        foreach (['logo', 'qris-image', 'login-image', 'banners/1'] as $endpoint) {
            $this->deleteJson('/api/settings/'.$endpoint)->assertForbidden()->assertJsonPath('message', DeletionControlService::MESSAGE);
        }
        $product = Product::factory()->create(['image_path' => 'products/qa.webp']);
        Storage::disk('public')->put('products/qa.webp', 'qa');
        $this->putJson('/api/products/'.$product->id, ['remove_image' => true])->assertForbidden();
        $this->postJson('/api/products/'.$product->id, ['_method' => 'PUT', 'remove_image' => '1'])->assertForbidden();
        $motor = $this->motor();
        $this->putJson('/motorcycles/'.$motor->id, ['remove_image' => true])->assertForbidden();
        $type = $this->type();
        $entry = $type->entries()->create(['name' => 'Foto QA', 'values' => [], 'image_path' => 'references/qa.webp']);
        $this->putJson('/references/'.$type->id.'/entries/'.$entry->id, ['remove_image' => true])->assertForbidden();
        $this->assertSame('products/qa.webp', $product->fresh()->image_path);
        Storage::disk('public')->assertExists('products/qa.webp');
        foreach (['logo', 'qris_image', 'login_image', 'promo_banner_1'] as $key) {
            $this->assertDatabaseHas('settings', ['group' => 'store', 'key' => $key, 'value' => 'qa/'.$key.'.webp']);
            Storage::disk('public')->assertExists('qa/'.$key.'.webp');
        }
    }

    public function test_inertia_forms_receive_a_flash_error_instead_of_a_false_success_when_locked(): void
    {
        $supplier = Supplier::create(['name' => 'Supplier QA']);
        $this->setDeletion(false);
        $this->from('/suppliers')->withHeader('X-Inertia', 'true')->delete('/suppliers/'.$supplier->id)
            ->assertRedirect('/suppliers')->assertSessionHasErrors('deletion')->assertSessionHas('error', DeletionControlService::MESSAGE);
        $this->assertDatabaseHas('suppliers', ['id' => $supplier->id]);
    }

    public function test_a_stale_page_or_post_method_override_cannot_delete_after_the_owner_locks_it(): void
    {
        $supplier = Supplier::create(['name' => 'Supplier QA']);
        $this->get('/suppliers')->assertInertia(fn (Assert $page) => $page->where('app_settings.deletion_enabled', true));
        $this->setDeletion(false);
        $this->postJson('/suppliers/'.$supplier->id, ['_method' => 'DELETE'])->assertForbidden();
        $this->assertDatabaseHas('suppliers', ['id' => $supplier->id]);
        $this->setDeletion(true);
        $this->from('/suppliers')->delete('/suppliers/'.$supplier->id)->assertRedirect('/suppliers');
        $this->assertDatabaseMissing('suppliers', ['id' => $supplier->id]);
    }

    public function test_empty_builtin_and_custom_types_follow_the_same_rules_and_removed_aliases_can_be_recreated(): void
    {
        $custom = $this->type();
        $preset = DataType::where('kind', 'product')->where('key', 'electronics')->sole();
        $this->setDeletion(false);
        foreach ([$custom, $preset] as $type) {
            $this->deleteJson('/data-types/'.$type->id)->assertForbidden();
        }
        $this->setDeletion(true);
        foreach ([$custom, $preset] as $type) {
            $this->deleteJson('/data-types/'.$type->id)->assertOk();
            $this->assertDatabaseMissing('data_types', ['id' => $type->id]);
        }
        $this->postJson('/data-types', ['kind' => 'product', 'name' => 'Elektronik', 'fields' => []])->assertCreated();
        $this->assertDatabaseHas('data_types', ['kind' => 'product', 'name' => 'Elektronik']);
    }

    public function test_used_types_remain_protected_and_motor_records_are_counted_for_the_driver(): void
    {
        $category = Category::factory()->create(['catalog_group' => 'automotive']);
        $productType = DataType::where('kind', 'product')->where('key', 'automotive')->sole();
        $referenceType = $this->type();
        $entry = $referenceType->entries()->create(['name' => 'QA', 'values' => []]);
        $motorType = DataType::where('driver', 'motorcycles')->sole();
        $motor = $this->motor();
        foreach ([$productType, $referenceType, $motorType] as $type) {
            $this->deleteJson('/data-types/'.$type->id)->assertUnprocessable()->assertJsonValidationErrors('type');
        }
        $this->get('/data-types')->assertInertia(fn (Assert $page) => $page->where('types', fn ($types) => collect($types)->firstWhere('id', $motorType->id)['records_count'] === 1));
        $this->assertNotNull($category->fresh());
        $this->assertNotNull($entry->fresh());
        $this->assertNotNull($motor->fresh());
    }

    public function test_a_deleted_builtin_motor_type_cannot_receive_new_orphaned_motor_records(): void
    {
        $type = DataType::where('driver', 'motorcycles')->sole();
        $this->deleteJson('/data-types/'.$type->id)->assertOk();
        $this->postJson('/motorcycles', ['brand' => 'Honda', 'model' => 'QA Motor', 'year_start' => 2020, 'engine_cc' => 110, 'engine_type' => 'matic'])->assertNotFound();
        $this->assertDatabaseCount('motorcycles', 0);
    }

    public function test_locking_does_not_block_creating_editing_or_reenabling_settings_and_cashiers_cannot_change_it(): void
    {
        $supplier = Supplier::create(['name' => 'Supplier QA']);
        $this->setDeletion(false);
        $this->from('/suppliers')->put('/suppliers/'.$supplier->id, ['name' => 'Nama Baru'])->assertRedirect('/suppliers');
        $this->from('/suppliers')->post('/suppliers', ['name' => 'Supplier Kedua'])->assertRedirect('/suppliers');
        $this->assertDatabaseHas('suppliers', ['id' => $supplier->id, 'name' => 'Nama Baru']);
        $cashier = User::factory()->create();
        $cashier->assignRole('cashier');
        $this->actingAs($cashier)->postJson('/api/settings', ['settings' => [
            ['group' => 'system', 'key' => 'deletion_enabled', 'value' => 'true'],
        ]])->assertForbidden();
        $this->actingAs($this->owner)->postJson('/api/settings', ['settings' => [
            ['group' => 'system', 'key' => 'deletion_enabled', 'value' => 'invalid'],
        ]])->assertUnprocessable();
        $this->setDeletion(true);
    }

    public function test_editing_a_category_cannot_silently_delete_existing_subcategories_while_locked(): void
    {
        $parent = Category::factory()->create(['name' => 'Kategori QA', 'catalog_group' => 'automotive']);
        $child = Category::factory()->create(['parent_id' => $parent->id, 'catalog_group' => 'automotive']);
        $this->setDeletion(false);
        $this->putJson('/api/categories/'.$parent->id, ['name' => 'Nama Diubah', 'catalog_group' => 'automotive', 'sub_categories' => []])
            ->assertUnprocessable()->assertJsonValidationErrors('sub_categories');
        $this->assertSame('Kategori QA', $parent->fresh()->name);
        $this->assertNotNull($child->fresh());
        $this->putJson('/api/categories/'.$parent->id, ['name' => 'Nama Diubah', 'catalog_group' => 'automotive',
            'sub_categories' => [['id' => $child->id, 'name' => 'Anak Diubah']]])->assertOk();
        $this->assertSame('Anak Diubah', $child->fresh()->name);
        $this->setDeletion(true);
        $this->putJson('/api/categories/'.$parent->id, ['name' => 'Nama Diubah', 'catalog_group' => 'automotive', 'sub_categories' => []])->assertOk();
        $this->assertDatabaseMissing('categories', ['id' => $child->id]);
    }

    public function test_all_registered_delete_routes_use_the_global_deletion_middleware(): void
    {
        $router = app('router');
        $count = 0;
        foreach ($router->getRoutes() as $route) {
            if (in_array('DELETE', $route->methods(), true)) {
                $this->assertContains(ControlAdminDeletion::class, $router->gatherRouteMiddleware($route), $route->uri());
                $count++;
            }
        }
        $this->assertGreaterThanOrEqual(15, $count);
    }

    public function test_invalid_persisted_setting_fails_closed_and_does_not_use_a_stale_cached_value(): void
    {
        $this->get('/suppliers')->assertOk(); // Cache the old shared settings before changing the row directly.
        Setting::create(['group' => 'system', 'key' => 'deletion_enabled', 'value' => 'invalid']);
        $supplier = Supplier::create(['name' => 'Supplier QA']);
        $this->deleteJson('/suppliers/'.$supplier->id)->assertForbidden();
        CacheService::flushSettings();
        $this->get('/suppliers')->assertInertia(fn (Assert $page) => $page->where('app_settings.deletion_enabled', false));
    }
}
