<?php

declare(strict_types=1);

namespace Tests\Feature\Payment;

use App\Models\Product;
use App\Models\Setting;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Tests\TestCase;
use Tests\Unit\QrisPayloadServiceTest;

class DynamicQrisTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleSeeder::class);
        Storage::fake('public');
    }

    private function staff(string $role = 'cashier'): User
    {
        $user = User::factory()->create();
        $user->assignRole($role);

        return $user;
    }

    private function setting(string $group, string $key, ?string $value): void
    {
        Setting::updateOrCreate(['group' => $group, 'key' => $key], ['value' => $value, 'type' => 'string']);
    }

    private function configure(): Product
    {
        $this->setting('store', 'qris_image', 'qris/store.webp');
        $this->setting('store', 'qris_payload', QrisPayloadServiceTest::sample());
        $this->setting('tax', 'enabled', 'true');
        $this->setting('tax', 'percentage', '11');

        return Product::factory()->create(['price' => 15000, 'stock' => 5, 'is_available' => true]);
    }

    private function quote(Product $product, int $quantity = 2)
    {
        return $this->postJson('/api/payments/qris/quote', [
            'items' => [['product_id' => $product->id, 'quantity' => $quantity]],
            'expected_amount' => 16650 * $quantity,
            'amount' => 1, 'price' => 1, // Client price overrides must be ignored.
        ]);
    }

    private function sale(Product $product, string $quote): array
    {
        return [
            'request_id' => (string) Str::uuid(),
            'items' => [['product_id' => $product->id, 'quantity' => 2]],
            'payment_method' => 'qris_manual', 'qris_quote' => $quote,
        ];
    }

    public function test_quote_uses_server_prices_and_tax_without_creating_a_payment_or_reserving_stock(): void
    {
        $this->actingAs($this->staff());
        $product = $this->configure();
        $response = $this->quote($product)->assertOk()->assertJsonPath('data.amount', 33300)
            ->assertJsonPath('data.merchant.name', 'TOKO UJI')->assertHeader('Cache-Control', 'no-store, private');
        $this->assertStringStartsWith('000201010212', $response->json('data.payload'));
        $this->assertStringContainsString('540533300', $response->json('data.payload'));
        $this->assertDatabaseCount('payments', 0);
        $this->assertDatabaseCount('orders', 0);
        $this->assertEquals(5, $product->fresh()->stock);
    }

    public function test_only_manual_cashier_confirmation_creates_a_paid_sale_and_retries_are_idempotent(): void
    {
        $this->actingAs($this->staff());
        $product = $this->configure();
        $token = $this->quote($product)->assertOk()->json('data.quote_token');
        $sale = $this->sale($product, $token);
        $response = $this->postJson('/api/orders/pos-sale', $sale)->assertCreated()
            ->assertJsonPath('data.payment.status', 'paid')->assertJsonPath('data.payment.payment_channel', 'manual_qris');
        $this->postJson('/api/orders/pos-sale', $sale)->assertCreated()->assertJsonPath('data.order.id', $response->json('data.order.id'));
        $this->assertDatabaseCount('payments', 1);
        $this->assertDatabaseCount('orders', 1);
        $this->assertEquals(3, $product->fresh()->stock);
    }

    public function test_stale_prices_cannot_be_confirmed_against_the_old_qr_and_all_stock_changes_are_rolled_back(): void
    {
        $this->actingAs($this->staff());
        $product = $this->configure();
        $token = $this->quote($product)->assertOk()->json('data.quote_token');
        $product->update(['price' => 20000]);
        $this->postJson('/api/orders/pos-sale', $this->sale($product, $token))->assertUnprocessable()->assertJsonValidationErrors('qris_quote');
        $this->assertDatabaseCount('payments', 0);
        $this->assertDatabaseCount('orders', 0);
        $this->assertEquals(5, $product->fresh()->stock);
    }

    public function test_changed_tax_cart_merchant_and_cashier_cannot_reuse_a_quote(): void
    {
        $cashier = $this->staff();
        $this->actingAs($cashier);
        $product = $this->configure();
        $token = $this->quote($product)->assertOk()->json('data.quote_token');
        $this->setting('tax', 'percentage', '12');
        $this->postJson('/api/orders/pos-sale', $this->sale($product, $token))->assertUnprocessable();
        $this->setting('tax', 'percentage', '11');
        $sale = $this->sale($product, $token);
        $sale['items'][0]['quantity'] = 1;
        $this->postJson('/api/orders/pos-sale', $sale)->assertUnprocessable();
        $this->setting('store', 'qris_payload', QrisPayloadServiceTest::sample(['59' => 'TOKO LAIN']));
        $this->postJson('/api/orders/pos-sale', $this->sale($product, $token))->assertUnprocessable();
        $this->setting('store', 'qris_payload', QrisPayloadServiceTest::sample());
        $this->actingAs($this->staff());
        $this->postJson('/api/orders/pos-sale', $this->sale($product, $token))->assertUnprocessable();
        $this->assertDatabaseCount('orders', 0);
        $this->assertDatabaseCount('payments', 0);
        $this->assertEquals(5, $product->fresh()->stock);
    }

    public function test_configured_dynamic_qris_requires_a_quote_and_disabled_qris_cannot_be_generated(): void
    {
        $this->actingAs($this->staff());
        $product = $this->configure();
        $sale = $this->sale($product, str_repeat('0', 64));
        unset($sale['qris_quote']);
        $this->postJson('/api/orders/pos-sale', $sale)->assertUnprocessable()->assertJsonValidationErrors('qris_quote');
        $this->setting('payment', 'qris_enabled', 'false');
        $this->quote($product)->assertUnprocessable();
        $this->assertDatabaseCount('orders', 0);
    }

    public function test_quote_rejects_stale_display_totals_invalid_items_and_excess_amounts(): void
    {
        $this->actingAs($this->staff());
        $product = $this->configure();
        $items = [['product_id' => $product->id, 'quantity' => 2]];
        $this->postJson('/api/payments/qris/quote', ['items' => $items, 'expected_amount' => 30000])->assertUnprocessable()->assertJsonValidationErrors('amount');
        $this->postJson('/api/payments/qris/quote', ['items' => $items, 'expected_amount' => 10000001])->assertUnprocessable();
        $this->postJson('/api/payments/qris/quote', ['items' => [['product_id' => $product->id, 'quantity' => -1]], 'expected_amount' => 1])->assertUnprocessable();
        $this->quote($product, 6)->assertUnprocessable()->assertJsonValidationErrors('items');
    }

    public function test_owner_can_upload_or_activate_a_qris_but_cashiers_and_guests_cannot_change_it(): void
    {
        $this->getJson('/api/settings/qris-image')->assertUnauthorized();
        $this->postJson('/api/payments/qris/quote', [])->assertUnauthorized();
        $product = $this->configure();
        $this->actingAs($this->staff());
        $this->postJson('/api/settings/qris-payload', [])->assertForbidden();
        $this->postJson('/api/settings/qris-image', ['qris_image' => UploadedFile::fake()->image('qris.png')])->assertForbidden();
        $this->getJson('/api/settings/qris-image')->assertOk()->assertJsonPath('dynamic_available', true);
        $this->actingAs($this->staff('owner'));
        $result = $this->postJson('/api/settings/qris-image', [
            'qris_image' => UploadedFile::fake()->image('qris.png'), 'qris_payload' => QrisPayloadServiceTest::sample(),
        ])->assertOk()->assertJsonPath('dynamic_available', true);
        $revision = $result->json('image_revision');
        $this->postJson('/api/settings/qris-payload', ['image_revision' => $revision, 'qris_payload' => QrisPayloadServiceTest::sample()])->assertOk();
        $this->postJson('/api/settings/qris-payload', ['image_revision' => str_repeat('0', 64), 'qris_payload' => QrisPayloadServiceTest::sample()])->assertUnprocessable();
        $this->assertEquals(5, $product->fresh()->stock);
    }

    public function test_invalid_upload_keeps_old_configuration_and_deleting_removes_the_file_and_payload(): void
    {
        $this->actingAs($this->staff('owner'));
        $this->configure();
        Storage::disk('public')->put('qris/store.webp', 'old-image');
        $this->postJson('/api/settings/qris-image', [
            'qris_image' => UploadedFile::fake()->image('bad.png'), 'qris_payload' => 'invalid',
        ])->assertUnprocessable()->assertJsonValidationErrors('qris_payload');
        Storage::disk('public')->assertExists('qris/store.webp');
        $this->assertDatabaseHas('settings', ['group' => 'store', 'key' => 'qris_image', 'value' => 'qris/store.webp']);
        $this->deleteJson('/api/settings/qris-image')->assertOk();
        Storage::disk('public')->assertMissing('qris/store.webp');
        $this->getJson('/api/settings/qris-image')->assertOk()->assertJsonPath('dynamic_available', false)->assertJsonPath('url', null);
        $this->assertDatabaseHas('settings', ['group' => 'store', 'key' => 'qris_payload', 'value' => null]);
    }

    public function test_replacing_a_legacy_image_clears_the_old_payload_and_old_quote_cannot_survive_deletion(): void
    {
        $this->actingAs($this->staff('owner'));
        $product = $this->configure();
        $token = $this->quote($product)->assertOk()->json('data.quote_token');
        $this->deleteJson('/api/settings/qris-image')->assertOk();
        $this->postJson('/api/orders/pos-sale', $this->sale($product, $token))->assertUnprocessable();
        $this->configure();
        $this->postJson('/api/settings/qris-image', ['qris_image' => UploadedFile::fake()->image('legacy.png')])->assertOk()->assertJsonPath('dynamic_available', false);
        $this->assertDatabaseHas('settings', ['group' => 'store', 'key' => 'qris_payload', 'value' => '']);
        $this->assertDatabaseCount('orders', 0);
    }
}
