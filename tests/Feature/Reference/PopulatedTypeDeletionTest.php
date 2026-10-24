<?php

declare(strict_types=1);

namespace Tests\Feature\Reference;

use App\Enums\InventoryLogType;
use App\Models\Category;
use App\Models\DataType;
use App\Models\Motorcycle;
use App\Models\MotorcyclePart;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use App\Services\CacheService;
use App\Services\DataTypeService;
use App\Services\InventoryService;
use App\Services\OrderService;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class PopulatedTypeDeletionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleSeeder::class);
        $owner = User::factory()->create();
        $owner->assignRole('owner');
        $this->actingAs($owner);
        Storage::fake('public');
    }

    private function motor(string $slug = 'motor-qa'): Motorcycle
    {
        return Motorcycle::create(['brand' => 'Honda', 'model' => $slug, 'slug' => $slug, 'year_start' => 2020,
            'engine_cc' => 110, 'engine_type' => 'matic', 'image_url' => '/storage/motorcycles/'.$slug.'.webp']);
    }

    private function reference(): DataType
    {
        return DataType::create(['kind' => 'reference', 'key' => 'qa_reference', 'name' => 'Referensi QA', 'fields' => []]);
    }

    public function test_builtin_product_type_deletes_all_categories_products_mappings_and_images_but_keeps_history_and_other_types(): void
    {
        $type = DataType::where('key', 'automotive')->sole();
        $parent = Category::factory()->create(['catalog_group' => $type->key]);
        $child = Category::factory()->create(['parent_id' => $parent->id, 'catalog_group' => $type->key]);
        $otherCategory = Category::factory()->create(['catalog_group' => 'electronics']);
        $other = Product::factory()->create(['category_id' => $otherCategory->id]);
        $product = Product::factory()->create(['category_id' => $child->id, 'image_path' => 'products/remove.webp']);
        Product::factory()->count(103)->create(['category_id' => $child->id]);
        Storage::disk('public')->put('products/remove.webp', 'qa');
        $motor = $this->motor();
        MotorcyclePart::create(['motorcycle_id' => $motor->id, 'product_id' => $product->id, 'part_category' => 'lainnya']);
        $reference = $this->reference()->entries()->create(['name' => 'QA', 'values' => []]);
        $reference->products()->attach($product->id, ['id' => fake()->uuid()]);
        $order = Order::factory()->create(['order_status' => 'completed', 'payment_status' => 'paid']);
        $item = OrderItem::factory()->create(['order_id' => $order->id, 'product_id' => $product->id, 'product_name' => $product->name]);
        $log = app(InventoryService::class)->adjustStock(['product_id' => $product->id, 'type' => InventoryLogType::Adjustment, 'quantity' => 10]);
        $cacheVersion = Cache::get('app:motorcycle:parts:version', 0);

        $this->deleteJson('/data-types/'.$type->id)->assertOk();

        $this->assertDatabaseMissing('data_types', ['id' => $type->id]);
        $this->assertDatabaseMissing('categories', ['catalog_group' => $type->key]);
        $this->assertDatabaseCount('products', 1);
        $this->assertNotNull($other->fresh());
        $this->assertNotNull($motor->fresh());
        $this->assertNotNull($reference->fresh());
        $this->assertDatabaseCount('motorcycle_parts', 0);
        $this->assertDatabaseCount('reference_entry_product', 0);
        $this->assertDatabaseHas('order_items', ['id' => $item->id, 'product_id' => null, 'product_name' => $product->name]);
        $this->assertDatabaseHas('inventory_logs', ['id' => $log->id, 'product_id' => null, 'product_name' => $product->name]);
        Storage::disk('public')->assertMissing('products/remove.webp');
        $this->assertGreaterThan($cacheVersion, Cache::get('app:motorcycle:parts:version'));
    }

    public function test_builtin_motor_reference_deletes_more_than_one_batch_of_motors_and_photos_without_deleting_products(): void
    {
        $type = DataType::where('driver', 'motorcycles')->sole();
        $product = Product::factory()->create();
        for ($i = 0; $i < 103; $i++) {
            $motor = $this->motor('qa-'.$i);
            Storage::disk('public')->put('motorcycles/qa-'.$i.'.webp', 'qa');
            MotorcyclePart::create(['motorcycle_id' => $motor->id, 'product_id' => $product->id, 'part_category' => 'lainnya']);
        }
        Cache::put(CacheService::MOTORCYCLES_LIST, ['old-data']);
        $this->deleteJson('/data-types/'.$type->id)->assertOk();
        $this->assertDatabaseCount('motorcycles', 0);
        $this->assertDatabaseCount('motorcycle_parts', 0);
        $this->assertNotNull($product->fresh());
        $this->assertSame([], Storage::disk('public')->allFiles('motorcycles'));
        $this->assertFalse(Cache::has(CacheService::MOTORCYCLES_LIST));
    }

    public function test_custom_reference_deletes_all_entries_and_their_files_but_preserves_linked_products_and_other_references(): void
    {
        $type = $this->reference();
        $otherType = DataType::create(['kind' => 'reference', 'key' => 'other_qa', 'name' => 'Referensi Lain', 'fields' => []]);
        $otherEntry = $otherType->entries()->create(['name' => 'Tetap ada', 'values' => []]);
        $product = Product::factory()->create(['stock' => 12]);
        for ($i = 0; $i < 103; $i++) {
            $entry = $type->entries()->create(['name' => 'QA '.$i, 'values' => [], 'image_path' => 'references/qa-'.$i.'.webp']);
            Storage::disk('public')->put($entry->image_path, 'qa');
            $entry->products()->attach($product->id, ['id' => fake()->uuid()]);
        }
        $this->deleteJson('/data-types/'.$type->id)->assertOk();
        $this->assertDatabaseMissing('reference_entries', ['data_type_id' => $type->id]);
        $this->assertDatabaseCount('reference_entry_product', 0);
        $this->assertSame(12, $product->fresh()->stock);
        $this->assertNotNull($otherEntry->fresh());
        $this->assertSame([], Storage::disk('public')->allFiles('references'));
    }

    public function test_locked_setting_denies_populated_types_without_deleting_any_contents_or_files(): void
    {
        $product = Product::factory()->create(['image_path' => 'products/keep.webp']);
        $motor = $this->motor();
        $type = $this->reference();
        $entry = $type->entries()->create(['name' => 'QA', 'values' => [], 'image_path' => 'references/keep.webp']);
        foreach (['products/keep.webp', 'motorcycles/motor-qa.webp', 'references/keep.webp'] as $path) {
            Storage::disk('public')->put($path, 'qa');
        }
        $this->postJson('/api/settings', ['settings' => [['group' => 'system', 'key' => 'deletion_enabled', 'value' => 'false']]])->assertOk();
        foreach ([DataType::where('key', 'automotive')->sole(), DataType::where('driver', 'motorcycles')->sole(), $type] as $target) {
            $this->deleteJson('/data-types/'.$target->id)->assertForbidden();
            $this->assertNotNull($target->fresh());
        }
        $this->assertNotNull($product->fresh());
        $this->assertNotNull($motor->fresh());
        $this->assertNotNull($entry->fresh());
        Storage::disk('public')->assertExists(['products/keep.webp', 'motorcycles/motor-qa.webp', 'references/keep.webp']);
    }

    public function test_bulk_deletion_rolls_back_records_and_keeps_files_if_deleting_the_type_fails(): void
    {
        $product = Product::factory()->create(['image_path' => 'products/rollback.webp']);
        $motor = $this->motor();
        $referenceType = $this->reference();
        $entry = $referenceType->entries()->create(['name' => 'QA', 'values' => [], 'image_path' => 'references/rollback.webp']);
        $paths = ['products/rollback.webp', 'motorcycles/motor-qa.webp', 'references/rollback.webp'];
        foreach ($paths as $path) {
            Storage::disk('public')->put($path, 'qa');
        }
        DataType::deleting(fn () => throw new \RuntimeException('QA rollback'));
        foreach ([DataType::where('key', 'automotive')->sole(), DataType::where('driver', 'motorcycles')->sole(), $referenceType] as $type) {
            try {
                app(DataTypeService::class)->delete($type);
                $this->fail('Expected rollback.');
            } catch (\RuntimeException $exception) {
                $this->assertSame('QA rollback', $exception->getMessage());
            }
            $this->assertNotNull($type->fresh());
        }
        $this->assertNotNull($product->fresh());
        $this->assertNotNull($motor->fresh());
        $this->assertNotNull($entry->fresh());
        Storage::disk('public')->assertExists($paths);
    }

    public function test_deleting_a_populated_category_or_subcategory_preserves_unrelated_categories_and_shared_images(): void
    {
        $parent = Category::factory()->create();
        $child = Category::factory()->create(['parent_id' => $parent->id]);
        $outside = Product::factory()->create(['image_path' => 'products/shared.webp']);
        $product = Product::factory()->create(['category_id' => $child->id, 'image_path' => 'products/shared.webp']);
        Storage::disk('public')->put('products/shared.webp', 'qa');
        $this->deleteJson('/api/categories/'.$parent->id)->assertOk();
        $this->assertNull($parent->fresh());
        $this->assertNull($child->fresh());
        $this->assertNull($product->fresh());
        $this->assertNotNull($outside->fresh());
        Storage::disk('public')->assertExists('products/shared.webp');
    }

    public function test_pending_orders_can_still_be_cancelled_after_a_product_is_permanently_deleted(): void
    {
        $deleted = Product::factory()->create(['stock' => 8]);
        $kept = Product::factory()->create(['stock' => 7]);
        $order = Order::factory()->create(['order_status' => 'pending', 'payment_status' => 'unpaid']);
        OrderItem::factory()->create(['order_id' => $order->id, 'product_id' => $deleted->id, 'quantity' => 2]);
        OrderItem::factory()->create(['order_id' => $order->id, 'product_id' => $kept->id, 'quantity' => 3]);
        $this->deleteJson('/api/products/'.$deleted->id)->assertOk();
        app(OrderService::class)->updateOrderStatus($order->id, ['order_status' => 'cancelled']);
        $this->assertSame('cancelled', $order->fresh()->order_status->value);
        $this->assertSame(10, $kept->fresh()->stock);
        $this->assertDatabaseCount('order_items', 2);
        $this->assertDatabaseCount('inventory_logs', 1);
    }
}
