<?php

declare(strict_types=1);

namespace Tests\Feature\Business;

use App\Models\Category;
use App\Models\DataType;
use App\Models\InventoryLog;
use App\Models\Order;
use App\Models\Product;
use App\Models\Setting;
use App\Models\Supplier;
use App\Models\User;
use App\Services\BusinessContext;
use App\Services\BusinessOnboardingService;
use App\Services\CacheService;
use App\Services\CashClosingService;
use App\Services\SettingService;
use App\Services\UserService;
use App\Support\BusinessFiles;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class BusinessIsolationTest extends TestCase
{
    use RefreshDatabase;

    private User $ownerA;

    private User $ownerB;

    private Product $productA;

    private Product $productB;

    private Category $categoryB;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleSeeder::class);
        Notification::fake();
        $this->ownerA = User::factory()->create();
        $this->ownerA->assignRole('owner');
        $this->productA = Product::factory()->create(['name' => 'Barang Toko A', 'sku' => 'SHARED-001', 'stock' => 10, 'price' => 1000]);
        $this->ownerB = app(BusinessOnboardingService::class)->register([
            'name' => 'Owner B', 'email' => 'business-b@example.test', 'business_name' => 'Usaha B', 'business_slug' => 'usaha-b', 'password' => 'Strong@1234',
        ], ['id' => 'owner-b-google', 'email' => 'business-b@example.test', 'trusted_email' => true]);
        $this->inB(function (): void {
            $this->categoryB = Category::factory()->create(['name' => 'Kategori B']);
            $this->productB = Product::factory()->create(['category_id' => $this->categoryB->id, 'name' => 'Barang Toko B', 'sku' => 'SHARED-001', 'stock' => 20, 'price' => 2000]);
            Supplier::create(['name' => 'Supplier rahasia B']);
        });
    }

    private function inB(\Closure $callback): mixed
    {
        return app(BusinessContext::class)->run($this->ownerB->business_id, $callback);
    }

    private function payload(Product $product, ?string $requestId = null): array
    {
        return ['request_id' => $requestId ?? (string) Str::uuid(), 'customer_name' => 'Pelanggan QA', 'items' => [['product_id' => $product->id, 'quantity' => 1]]];
    }

    public function test_existing_data_and_same_sku_remain_in_separate_businesses(): void
    {
        $this->assertSame(BusinessContext::LEGACY_ID, $this->productA->business_id);
        $this->assertSame([$this->productA->id], Product::pluck('id')->all());
        $this->assertSame(0, Supplier::count());
        $this->inB(function (): void {
            $this->assertSame([$this->productB->id], Product::pluck('id')->all());
            $this->assertSame(1, Supplier::count());
            $this->assertSame([$this->ownerB->id], User::pluck('id')->all());
        });
        $this->assertSame(BusinessContext::LEGACY_ID, app(BusinessContext::class)->id());
    }

    public function test_admin_cannot_select_another_business_through_query_parameters(): void
    {
        $this->actingAs($this->ownerA)->get('/dashboard?shop=usaha-b')->assertOk()->assertInertia(fn ($page) => $page->where('business.id', BusinessContext::LEGACY_ID));
        $this->getJson('/api/products?shop=usaha-b')->assertOk()->assertSee('Barang Toko A')->assertDontSee('Barang Toko B');
        $this->getJson('/api/users/'.$this->ownerB->id)->assertNotFound();
        $this->getJson('/api/products/'.$this->productB->id)->assertNotFound();
        $this->deleteJson('/api/products/'.$this->productB->id)->assertNotFound();
        $this->assertDatabaseHas('products', ['id' => $this->productB->id, 'stock' => 20]);
    }

    public function test_model_binding_cannot_delete_another_business_type_or_supplier(): void
    {
        [$type, $supplier] = $this->inB(fn () => [DataType::firstOrFail(), Supplier::firstOrFail()]);
        $this->actingAs($this->ownerA)->delete('/data-types/'.$type->id)->assertNotFound();
        $this->delete('/suppliers/'.$supplier->id)->assertNotFound();
        $this->assertDatabaseHas('data_types', ['id' => $type->id]);
        $this->assertDatabaseHas('suppliers', ['id' => $supplier->id]);
    }

    public function test_foreign_ids_are_rejected_before_product_inventory_and_order_writes(): void
    {
        $this->actingAs($this->ownerA)->postJson('/api/products', ['category_id' => $this->categoryB->id, 'sku' => 'NEW', 'name' => 'Injected', 'price' => 1000, 'stock' => 1])->assertUnprocessable()->assertJsonValidationErrors('category_id');
        $this->postJson('/api/orders', $this->payload($this->productB))->assertUnprocessable()->assertJsonValidationErrors('items.0.product_id');
        $this->postJson('/api/inventory', ['product_id' => $this->productB->id, 'type' => 'stock_in', 'quantity' => 1])->assertUnprocessable()->assertJsonValidationErrors('product_id');
        $this->assertDatabaseHas('products', ['id' => $this->productB->id, 'stock' => 20]);
    }

    public function test_public_catalogs_and_unknown_slugs_never_fall_back_to_another_store(): void
    {
        $this->get('/')->assertOk()->assertInertia(fn ($page) => $page->where('initialProducts.0.id', $this->productA->id)->has('initialProducts', 1));
        $this->get('/s/usaha-b')->assertOk()->assertInertia(fn ($page) => $page->where('initialProducts.0.id', $this->productB->id)->has('initialProducts', 1)->where('shop_slug', 'usaha-b'));
        $this->get('/s/unknown-store')->assertNotFound();
        $this->get('/?shop[]=usaha-b')->assertNotFound();
        $this->actingAs($this->ownerA)->get('/s/usaha-b')->assertOk()->assertInertia(fn ($page) => $page->where('auth.user', null)->where('business.id', $this->ownerB->business_id));
    }

    public function test_public_checkout_sequences_idempotency_inventory_and_customer_tokens_are_isolated(): void
    {
        $requestId = (string) Str::uuid();
        $a = $this->postJson('/api/customer/order', $this->payload($this->productA, $requestId))->assertCreated()->json('data');
        $b = $this->postJson('/api/customer/order?shop=usaha-b', $this->payload($this->productB, $requestId))->assertCreated()->json('data');
        $this->assertNotSame($a['id'], $b['id']);
        $this->assertSame($a['order_number'], $b['order_number']);
        $this->assertSame(1, Order::count());
        $this->assertSame(1, InventoryLog::count());
        $this->assertDatabaseHas('products', ['id' => $this->productA->id, 'stock' => 9]);
        $this->assertDatabaseHas('products', ['id' => $this->productB->id, 'stock' => 19]);
        $this->getJson('/api/customer/order/'.$b['id'].'/status?customer_token='.$b['customer_token'])->assertUnauthorized();
        $this->getJson('/api/customer/order/'.$b['id'].'/status?shop=usaha-b&customer_token='.$b['customer_token'])->assertOk();
        $this->assertDatabaseHas('order_items', ['order_id' => $b['id'], 'business_id' => $this->ownerB->business_id]);
    }

    public function test_cache_settings_and_invalidation_only_affect_the_selected_business(): void
    {
        app(SettingService::class)->upsertSetting('store', 'name', 'Usaha A');
        $this->get('/')->assertInertia(fn ($page) => $page->where('app_settings.store_name', 'Usaha A'));
        $this->get('/s/usaha-b')->assertInertia(fn ($page) => $page->where('app_settings.store_name', 'Usaha B'));
        Cache::forever(CacheService::key(CacheService::SETTINGS_ALL), 'A');
        $this->inB(function (): void {
            Cache::forever(CacheService::key(CacheService::SETTINGS_ALL), 'B');
            CacheService::flushSettings();
            $this->assertNull(Cache::get(CacheService::key(CacheService::SETTINGS_ALL)));
        });
        $this->assertSame('A', Cache::get(CacheService::key(CacheService::SETTINGS_ALL)));
    }

    public function test_cash_day_locks_are_per_business(): void
    {
        DB::transaction(fn () => app(CashClosingService::class)->assertCashDayOpen(now()->toDateString()));
        $this->inB(fn () => DB::transaction(fn () => app(CashClosingService::class)->assertCashDayOpen(now()->toDateString())));
        $this->assertSame(2, DB::table('cash_day_locks')->count());
    }

    public function test_model_writes_cannot_attach_a_foreign_business_parent(): void
    {
        $this->expectException(ValidationException::class);
        Product::factory()->create(['category_id' => $this->categoryB->id]);
    }

    public function test_business_cannot_delete_another_business_file(): void
    {
        Storage::fake('public');
        $path = 'products/'.$this->ownerB->business_id.'/private-image.webp';
        Storage::disk('public')->put($path, 'fixture');
        $this->assertFalse(BusinessFiles::delete($path));
        Storage::disk('public')->assertExists($path);
        $this->inB(fn () => $this->assertTrue(BusinessFiles::delete($path)));
        Storage::disk('public')->assertMissing($path);
    }

    public function test_staff_invitation_can_activate_only_its_original_business_account(): void
    {
        [$staff, $token] = $this->inB(function (): array {
            $staff = app(UserService::class)->createEmployee(['name' => 'Kasir B', 'email' => 'cashier-b@example.test', 'password' => Str::random(40), 'role' => 'cashier', 'invitation_pending' => true]);

            return [$staff, Password::broker('staff_invitations')->createToken($staff)];
        });
        $this->assertTrue(app(UserService::class)->isInvitationValid($staff->email, $token));
        $this->post('/staff/invitation', ['email' => $staff->email, 'token' => $token, 'password' => 'New@Strong123', 'password_confirmation' => 'New@Strong123'])->assertRedirect('/login');
        $this->post('/login', ['email' => $staff->email, 'password' => 'New@Strong123'])->assertRedirect('/pos');
        $this->get('/pos')->assertOk()->assertInertia(fn ($page) => $page->where('business.id', $this->ownerB->business_id)->where('initialProducts.0.id', $this->productB->id));
    }

    public function test_api_token_authenticates_its_own_business_account_only(): void
    {
        $token = $this->ownerB->createToken('qa')->plainTextToken;
        $this->withToken($token)->getJson('/api/user?shop=toko-utama')->assertOk()->assertJsonPath('id', $this->ownerB->id)->assertJsonPath('business_id', $this->ownerB->business_id)->assertJsonMissingPath('google_id');
    }

    public function test_public_settings_exclude_payment_payload_and_other_business_values(): void
    {
        Setting::create(['group' => 'store', 'key' => 'qris_payload', 'value' => 'PRIVATE-QRIS-A']);
        $this->inB(fn () => Setting::create(['group' => 'store', 'key' => 'qris_payload', 'value' => 'PRIVATE-QRIS-B']));
        $this->get('/')->assertOk()->assertDontSee('PRIVATE-QRIS-A')->assertDontSee('PRIVATE-QRIS-B')->assertInertia(fn ($page) => $page->missing('settings.store.qris_payload'));
        $this->get('/s/usaha-b')->assertOk()->assertDontSee('PRIVATE-QRIS-A')->assertDontSee('PRIVATE-QRIS-B');
    }

    public function test_expiry_job_runs_with_each_business_stock_and_timezone(): void
    {
        $a = $this->postJson('/api/customer/order', $this->payload($this->productA))->assertCreated()->json('data.id');
        $b = $this->postJson('/api/customer/order?shop=usaha-b', $this->payload($this->productB))->assertCreated()->json('data.id');
        Order::whereKey($a)->update(['expires_at' => now()->subMinute()]);
        $this->inB(fn () => Order::whereKey($b)->update(['expires_at' => now()->subMinute()]));
        $this->artisan('orders:expire-stale')->assertSuccessful();
        $this->assertDatabaseHas('orders', ['id' => $a, 'order_status' => 'cancelled']);
        $this->assertDatabaseHas('orders', ['id' => $b, 'order_status' => 'cancelled']);
        $this->assertDatabaseHas('products', ['id' => $this->productA->id, 'stock' => 10]);
        $this->assertDatabaseHas('products', ['id' => $this->productB->id, 'stock' => 20]);
        $this->assertSame(BusinessContext::LEGACY_ID, app(BusinessContext::class)->id());
        $this->assertSame('Asia/Jakarta', config('app.timezone'));
    }

    public function test_paid_sales_reports_and_exported_catalog_only_contain_the_owner_business(): void
    {
        $this->actingAs($this->ownerA)->postJson('/api/orders/pos-sale', [...$this->payload($this->productA), 'amount_received' => 1000])->assertCreated();
        $this->actingAs($this->ownerB)->postJson('/api/orders/pos-sale', [...$this->payload($this->productB), 'amount_received' => 2000])->assertCreated();
        $this->getJson('/api/reports/daily')->assertOk()->assertJsonPath('data.total_revenue', 2000)->assertJsonPath('data.total_orders', 1);
        $response = $this->get('/api/products/sheets/export?format=csv')->assertOk();
        $path = $response->baseResponse->getFile()->getPathname();
        try {
            $csv = file_get_contents($path);
            $this->assertStringContainsString('Barang Toko B', $csv);
            $this->assertStringNotContainsString('Barang Toko A', $csv);
        } finally {
            @unlink($path);
        }
        $this->actingAs($this->ownerA)->getJson('/api/reports/daily')->assertOk()->assertJsonPath('data.total_revenue', 1000)->assertJsonPath('data.total_orders', 1);
    }

    public function test_import_drafts_cannot_be_read_by_another_business_owner(): void
    {
        $file = UploadedFile::fake()->createWithContent('barang.csv', "Nama Barang,Harga Jual (Rp),Stok\nProduk B,5000,3\n");
        $draft = $this->actingAs($this->ownerB)->post('/api/products/sheets/inspect', ['file' => $file], ['Accept' => 'application/json'])->assertOk()->json();
        $this->actingAs($this->ownerA)->postJson('/api/products/sheets/preview', [
            'token' => $draft['token'], 'mode' => 'add', 'default_group' => 'automotive', 'use_estimated_cost' => false,
            'sheets' => array_map(fn ($sheet) => ['id' => $sheet['id'], 'mapping' => $sheet['mapping']], $draft['sheets']),
        ])->assertUnprocessable();
        $this->assertDatabaseHas('product_sheet_imports', ['id' => $draft['token'], 'business_id' => $this->ownerB->business_id]);
    }
}
