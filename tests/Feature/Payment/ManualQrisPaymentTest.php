<?php

namespace Tests\Feature\Payment;

use App\Models\Order;
use App\Models\Payment;
use App\Models\Product;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class ManualQrisPaymentTest extends TestCase
{
    use RefreshDatabase;

    private function staff(string $role): User
    {
        $this->seed(\Database\Seeders\RoleSeeder::class);
        $user = User::factory()->create();
        $user->assignRole($role);

        return $user;
    }

    #[Test]
    public function owner_uploads_qr_cashier_reads_it_and_confirms_pos_payment(): void
    {
        Storage::fake('public');
        $owner = $this->staff('owner');
        $cashier = $this->staff('cashier');

        $this->actingAs($cashier)->postJson('/api/settings/qris-image', [
            'qris_image' => UploadedFile::fake()->image('qris.png'),
        ])->assertForbidden();

        $this->actingAs($owner)->postJson('/api/settings/qris-image', [
            'qris_image' => UploadedFile::fake()->image('qris.png'),
        ])->assertOk()->assertJsonPath('url', fn ($url) => str_starts_with($url, '/storage/qris/'));

        $this->actingAs($cashier)->getJson('/api/settings/qris-image')
            ->assertOk()->assertJsonPath('url', fn ($url) => str_starts_with($url, '/storage/qris/'));

        $product = Product::factory()->create(['is_available' => true, 'stock' => 5, 'price' => 15000]);
        $response = $this->actingAs($cashier)->postJson('/api/orders/pos-sale', [
            'items' => [['product_id' => $product->id, 'quantity' => 1]],
            'payment_method' => 'qris_manual',
            'reference_number' => 'QR-123',
        ])->assertCreated()
            ->assertJsonPath('data.order.order_status', 'completed')
            ->assertJsonPath('data.order.payment_status', 'paid');

        $this->assertDatabaseHas('payments', [
            'order_id' => $response->json('data.order.id'),
            'payment_method' => 'qris_manual',
            'payment_channel' => 'manual_qris',
            'reference_number' => 'QR-123',
            'change_amount' => 0,
            'status' => 'paid',
        ]);
        $this->assertEquals(4, $product->fresh()->stock);
    }

    #[Test]
    public function manual_qris_requires_an_image_and_cannot_pay_twice(): void
    {
        $cashier = $this->staff('cashier');
        $order = Order::factory()->create(['total' => 25000, 'payment_status' => 'unpaid']);

        $this->actingAs($cashier)->postJson('/api/payments', [
            'order_id' => $order->id,
            'payment_method' => 'qris_manual',
        ])->assertUnprocessable();

        Setting::create(['group' => 'store', 'key' => 'qris_image', 'value' => 'qris/store.png', 'type' => 'string']);

        $this->actingAs($cashier)->postJson('/api/payments', [
            'order_id' => $order->id,
            'payment_method' => 'qris_manual',
        ])->assertCreated()->assertJsonPath('data.status', 'paid');

        $this->actingAs($cashier)->postJson('/api/payments', [
            'order_id' => $order->id,
            'payment_method' => 'qris_manual',
        ])->assertUnprocessable();
        $this->assertDatabaseCount('payments', 1);
    }

    #[Test]
    public function paying_an_old_order_does_not_modify_legacy_gateway_records(): void
    {
        $cashier = $this->staff('cashier');
        $order = Order::factory()->create(['total' => 25000, 'payment_status' => 'unpaid']);
        $legacy = Payment::factory()->create([
            'order_id' => $order->id,
            'payment_channel' => 'doku_checkout',
            'status' => 'pending',
        ]);

        $this->actingAs($cashier)->postJson('/api/payments', [
            'order_id' => $order->id,
            'payment_method' => 'cash',
            'amount_received' => 25000,
        ])->assertCreated();

        $this->assertEquals('pending', $legacy->fresh()->status);
    }
}
