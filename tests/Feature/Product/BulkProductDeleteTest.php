<?php

declare(strict_types=1);

namespace Tests\Feature\Product;

use App\Enums\InventoryLogType;
use App\Models\Business;
use App\Models\Category;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Setting;
use App\Models\User;
use App\Services\BusinessContext;
use App\Services\InventoryService;
use App\Services\ProductService;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Tests\TestCase;

final class BulkProductDeleteTest extends TestCase
{
    use RefreshDatabase;

    private User $owner;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleSeeder::class);
        $this->owner = User::factory()->create();
        $this->owner->assignRole('owner');
        $this->actingAs($this->owner);
    }

    private function preview(array $selection): array
    {
        return $this->postJson('/api/products/bulk-delete/preview', $selection)->assertOk()->json('data');
    }

    private function filterSelection(array $filters = [], array $excluded = []): array
    {
        return ['mode' => 'filtered', 'filters' => $filters, 'excluded_ids' => $excluded];
    }

    public function test_owner_deletes_only_selected_products_and_preserves_shared_images(): void
    {
        Storage::fake('public');
        Storage::disk('public')->put('products/shared.webp', 'shared');
        Storage::disk('public')->put('products/unique.webp', 'unique');
        $a = Product::factory()->create(['image_path' => 'products/shared.webp']);
        $b = Product::factory()->create(['image_path' => 'products/unique.webp']);
        $keep = Product::factory()->create(['image_path' => 'products/shared.webp']);

        $preview = $this->preview(['mode' => 'ids', 'ids' => [$a->id, $b->id]]);
        $this->assertSame(2, $preview['count']);
        $this->assertDatabaseCount('products', 3);
        $this->deleteJson('/api/products/bulk', ['token' => $preview['token']])->assertOk()->assertJsonPath('data.deleted_count', 2);

        $this->assertDatabaseMissing('products', ['id' => $a->id]);
        $this->assertDatabaseMissing('products', ['id' => $b->id]);
        $this->assertDatabaseHas('products', ['id' => $keep->id]);
        Storage::disk('public')->assertExists('products/shared.webp');
        Storage::disk('public')->assertMissing('products/unique.webp');
    }

    public function test_select_all_uses_filters_across_pages_and_respects_exclusions(): void
    {
        $root = Category::factory()->create(['name' => 'Bulk Parent', 'catalog_group' => 'automotive']);
        $child = Category::factory()->create(['name' => 'Bulk Child', 'parent_id' => $root->id]);
        $matches = Product::factory()->count(30)->create(['name' => 'Bulkmarker Target', 'category_id' => $child->id, 'stock' => 1, 'minimum_stock' => 3, 'is_available' => true]);
        $inactive = Product::factory()->create(['name' => 'Bulkmarker Inactive', 'category_id' => $child->id, 'stock' => 1, 'minimum_stock' => 3, 'is_available' => false]);
        $normal = Product::factory()->create(['name' => 'Bulkmarker Normal', 'category_id' => $child->id, 'stock' => 20, 'minimum_stock' => 3]);
        $outside = Product::factory()->create(['name' => 'Bulkmarker Other Category', 'stock' => 1, 'minimum_stock' => 3]);
        $selection = $this->filterSelection(['group' => 'automotive', 'category' => $root->name, 'search' => 'bulkmarker', 'stock_status' => 'low', 'availability' => 'active'], [$matches[0]->id]);

        $preview = $this->preview($selection);
        $this->assertSame(29, $preview['count']);
        $this->deleteJson('/api/products/bulk', ['token' => $preview['token']])->assertOk()->assertJsonPath('data.deleted_count', 29);

        foreach ([$matches[0], $inactive, $normal, $outside] as $product) {
            $this->assertDatabaseHas('products', ['id' => $product->id]);
        }
        $this->assertDatabaseCount('products', 4);
    }

    public function test_foreign_ids_reject_the_entire_selection_and_all_matching_never_crosses_businesses(): void
    {
        $own = Product::factory()->create();
        $other = Business::create(['name' => 'Other', 'slug' => 'bulk-other']);
        $foreign = app(BusinessContext::class)->run($other->id, fn () => Product::factory()->create());

        $this->postJson('/api/products/bulk-delete/preview', ['mode' => 'ids', 'ids' => [$own->id, $foreign->id]])->assertUnprocessable();
        $this->assertDatabaseHas('products', ['id' => $own->id]);
        $preview = $this->preview($this->filterSelection());
        $this->assertSame(1, $preview['count']);
        $this->deleteJson('/api/products/bulk', ['token' => $preview['token']])->assertOk();
        $this->assertDatabaseHas('products', ['id' => $foreign->id]);
    }

    public function test_locked_deletion_is_rechecked_after_preview(): void
    {
        $product = Product::factory()->create();
        $preview = $this->preview(['mode' => 'ids', 'ids' => [$product->id]]);
        Setting::create(['group' => 'system', 'key' => 'deletion_enabled', 'value' => 'false']);

        $this->postJson('/api/products/bulk-delete/preview', ['mode' => 'ids', 'ids' => [$product->id]])->assertForbidden();
        $this->deleteJson('/api/products/bulk', ['token' => $preview['token']])->assertForbidden();
        $this->assertDatabaseHas('products', ['id' => $product->id]);
    }

    public function test_cashier_and_another_owner_cannot_reuse_a_confirmation(): void
    {
        $product = Product::factory()->create();
        $preview = $this->preview(['mode' => 'ids', 'ids' => [$product->id]]);
        $cashier = User::factory()->create();
        $cashier->assignRole('cashier');
        $this->actingAs($cashier)->postJson('/api/products/bulk-delete/preview', ['mode' => 'ids', 'ids' => [$product->id]])->assertForbidden();
        $this->deleteJson('/api/products/bulk', ['token' => $preview['token']])->assertForbidden();
        $owner = User::factory()->create();
        $owner->assignRole('owner');
        $this->actingAs($owner)->deleteJson('/api/products/bulk', ['token' => $preview['token']])->assertForbidden();
        $this->assertDatabaseHas('products', ['id' => $product->id]);
    }

    public function test_stock_or_product_changes_require_a_new_confirmation(): void
    {
        $product = Product::factory()->create();
        $preview = $this->preview(['mode' => 'ids', 'ids' => [$product->id]]);
        $product->increment('sync_version');

        $this->deleteJson('/api/products/bulk', ['token' => $preview['token']])->assertConflict();
        $this->assertDatabaseHas('products', ['id' => $product->id]);
    }

    public function test_same_count_with_different_products_does_not_delete_unreviewed_products(): void
    {
        $old = Product::factory()->create();
        $keep = Product::factory()->create();
        $preview = $this->preview($this->filterSelection());
        $old->delete();
        $new = Product::factory()->create();

        $this->deleteJson('/api/products/bulk', ['token' => $preview['token']])->assertConflict();
        $this->assertDatabaseHas('products', ['id' => $keep->id]);
        $this->assertDatabaseHas('products', ['id' => $new->id]);
    }

    public function test_expired_tampered_and_replayed_confirmations_do_not_delete_more_data(): void
    {
        $product = Product::factory()->create();
        $preview = $this->preview(['mode' => 'ids', 'ids' => [$product->id]]);
        $this->deleteJson('/api/products/bulk', ['token' => 'tampered'])->assertUnprocessable();
        $this->travel(6)->minutes();
        $this->deleteJson('/api/products/bulk', ['token' => $preview['token']])->assertConflict();
        $preview = $this->preview(['mode' => 'ids', 'ids' => [$product->id]]);
        $this->deleteJson('/api/products/bulk', ['token' => $preview['token']])->assertOk();
        $new = Product::factory()->create();
        $this->deleteJson('/api/products/bulk', ['token' => $preview['token']])->assertConflict();
        $this->assertDatabaseHas('products', ['id' => $new->id]);
    }

    public function test_empty_duplicate_and_missing_selections_are_rejected(): void
    {
        $product = Product::factory()->create();
        foreach ([['mode' => 'ids', 'ids' => []], ['mode' => 'ids', 'ids' => [$product->id, $product->id]], ['mode' => 'filtered']] as $selection) {
            $this->postJson('/api/products/bulk-delete/preview', $selection)->assertUnprocessable();
        }
        $this->deleteJson('/api/products/bulk')->assertUnprocessable();
        $this->assertDatabaseHas('products', ['id' => $product->id]);
    }

    public function test_failure_rolls_back_the_whole_batch_and_keeps_files(): void
    {
        Storage::fake('public');
        Storage::disk('public')->put('products/rollback.webp', 'keep');
        $products = Product::factory()->count(2)->create(['image_path' => 'products/rollback.webp'])->sortBy('id')->values();
        $preview = $this->preview(['mode' => 'ids', 'ids' => $products->pluck('id')->all()]);
        $original = Product::getEventDispatcher();
        $events = clone $original;
        $events->listen('eloquent.deleting: '.Product::class, function (Product $product) use ($products): void {
            if ($product->id === $products[1]->id) {
                throw new \RuntimeException('Simulated delete failure');
            }
        });
        Product::setEventDispatcher($events);
        try {
            app(ProductService::class)->bulkDelete($preview['token'], $this->owner);
            $this->fail('Expected the simulated failure.');
        } catch (\RuntimeException $exception) {
            $this->assertSame('Simulated delete failure', $exception->getMessage());
        } finally {
            Product::setEventDispatcher($original);
        }
        foreach ($products as $product) {
            $this->assertDatabaseHas('products', ['id' => $product->id]);
        }
        Storage::disk('public')->assertExists('products/rollback.webp');
    }

    public function test_batch_deletion_preserves_invoice_and_inventory_snapshots(): void
    {
        $products = Product::factory()->count(2)->create(['stock' => 5]);
        $order = Order::factory()->create(['order_status' => 'completed', 'payment_status' => 'paid']);
        $snapshots = [];
        foreach ($products as $product) {
            $item = OrderItem::factory()->create(['order_id' => $order->id, 'product_id' => $product->id, 'product_name' => $product->name]);
            $log = app(InventoryService::class)->adjustStock(['product_id' => $product->id, 'type' => InventoryLogType::Adjustment, 'quantity' => 6]);
            $snapshots[] = [$product->name, $item->id, $log->id];
        }
        $preview = $this->preview(['mode' => 'ids', 'ids' => $products->pluck('id')->all()]);

        $this->deleteJson('/api/products/bulk', ['token' => $preview['token']])->assertOk();

        foreach ($snapshots as [$name, $itemId, $logId]) {
            $this->assertDatabaseHas('order_items', ['id' => $itemId, 'product_id' => null, 'product_name' => $name]);
            $this->assertDatabaseHas('inventory_logs', ['id' => $logId, 'product_id' => null, 'product_name' => $name]);
        }
        $this->assertDatabaseHas('orders', ['id' => $order->id]);
    }

    public function test_excessive_filtered_selection_fails_before_any_deletion(): void
    {
        $category = Category::factory()->create();
        $rows = [];
        for ($i = 0; $i <= ProductService::MAX_BULK_DELETE; $i++) {
            $rows[] = ['id' => (string) Str::uuid(), 'business_id' => BusinessContext::LEGACY_ID,
                'category_id' => $category->id, 'name' => 'Bulk limit '.$i, 'sku' => 'BULK-LIMIT-'.$i, 'price' => 1000];
        }
        DB::table('products')->insert($rows);

        $this->postJson('/api/products/bulk-delete/preview', $this->filterSelection())->assertUnprocessable();
        $this->assertDatabaseCount('products', ProductService::MAX_BULK_DELETE + 1);
    }

    public function test_guest_cannot_preview_or_execute_a_deletion(): void
    {
        auth()->forgetGuards();
        $this->postJson('/api/products/bulk-delete/preview', $this->filterSelection())->assertUnauthorized();
        $this->deleteJson('/api/products/bulk', ['token' => 'anything'])->assertUnauthorized();
    }
}
