<?php

namespace Tests\Feature\Payment;

use App\Models\Order;
use App\Models\Payment;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class DokuWebhookTest extends TestCase
{
    use RefreshDatabase;

    private string $clientId = 'TEST_CLIENT_ID';
    private string $sharedKey = 'TEST_SHARED_KEY';

    protected function setUp(): void
    {
        parent::setUp();
        config([
            'doku.enabled' => true,
            'doku.client_id' => $this->clientId,
            'doku.shared_key' => $this->sharedKey,
        ]);

        \Illuminate\Support\Facades\Route::post('/api/webhook/doku', [\App\Http\Controllers\Payment\DokuPaymentController::class, 'handleWebhook']);
        \Illuminate\Support\Facades\Route::post('/api/customer/payment/qris/check-status', [\App\Http\Controllers\Payment\DokuPaymentController::class, 'checkPaymentStatus']);
    }

    private function generateSignature(array $payload, string $timestamp, string $requestId, string $target = '/api/webhook/doku'): string
    {
        $body = json_encode($payload);
        $digest = base64_encode(hash('sha256', $body, true));
        $raw = "Client-Id:{$this->clientId}\nRequest-Id:{$requestId}\nRequest-Timestamp:{$timestamp}\nRequest-Target:{$target}\nDigest:{$digest}";
        return 'HMACSHA256=' . base64_encode(hash_hmac('sha256', $raw, $this->sharedKey, true));
    }

    public function test_webhook_rejects_missing_headers(): void
    {
        $response = $this->postJson('/api/webhook/doku', [
            'order' => ['invoice_number' => 'INV-123'],
            'transaction' => ['status' => 'SUCCESS'],
        ]);

        $response->assertStatus(401)
            ->assertJson(['message' => 'Invalid signature']);
    }

    public function test_webhook_rejects_invalid_signature(): void
    {
        $response = $this->postJson('/api/webhook/doku', [
            'order' => ['invoice_number' => 'INV-123'],
            'transaction' => ['status' => 'SUCCESS'],
        ], [
            'Client-Id' => $this->clientId,
            'Request-Id' => (string) Str::uuid(),
            'Request-Timestamp' => now()->utc()->format('Y-m-d\TH:i:s\Z'),
            'Signature' => 'HMACSHA256=invalid_signature_hash',
        ]);

        $response->assertStatus(401)
            ->assertJson(['message' => 'Invalid signature']);
    }

    public function test_webhook_processes_successful_payment(): void
    {
        $order = Order::factory()->create(['payment_status' => 'unpaid']);
        $payment = Payment::factory()->pending()->create([
            'order_id' => $order->id,
            'invoice_number' => 'INV-20260725-TEST01',
            'payment_channel' => 'doku_checkout',
            'payment_method' => 'qris',
        ]);

        $payload = [
            'order' => ['invoice_number' => 'INV-20260725-TEST01'],
            'transaction' => ['status' => 'SUCCESS'],
        ];

        $requestId = (string) Str::uuid();
        $timestamp = now()->utc()->format('Y-m-d\TH:i:s\Z');
        $signature = $this->generateSignature($payload, $timestamp, $requestId);

        $response = $this->postJson('/api/webhook/doku', $payload, [
            'Client-Id' => $this->clientId,
            'Request-Id' => $requestId,
            'Request-Timestamp' => $timestamp,
            'Signature' => $signature,
        ]);

        $response->assertStatus(200)
            ->assertJson(['message' => 'OK']);

        $this->assertDatabaseHas('payments', [
            'id' => $payment->id,
            'status' => 'paid',
        ]);

        $this->assertDatabaseHas('orders', [
            'id' => $order->id,
            'payment_status' => 'paid',
        ]);
    }

    public function test_webhook_processes_failed_payment(): void
    {
        $order = Order::factory()->create(['payment_status' => 'unpaid']);
        $payment = Payment::factory()->pending()->create([
            'order_id' => $order->id,
            'invoice_number' => 'INV-20260725-TEST02',
        ]);

        $payload = [
            'order' => ['invoice_number' => 'INV-20260725-TEST02'],
            'transaction' => ['status' => 'FAILED'],
        ];

        $requestId = (string) Str::uuid();
        $timestamp = now()->utc()->format('Y-m-d\TH:i:s\Z');
        $signature = $this->generateSignature($payload, $timestamp, $requestId);

        $response = $this->postJson('/api/webhook/doku', $payload, [
            'Client-Id' => $this->clientId,
            'Request-Id' => $requestId,
            'Request-Timestamp' => $timestamp,
            'Signature' => $signature,
        ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('payments', [
            'id' => $payment->id,
            'status' => 'failed',
        ]);
    }

    public function test_webhook_processes_expired_payment(): void
    {
        $order = Order::factory()->create(['payment_status' => 'unpaid']);
        $payment = Payment::factory()->pending()->create([
            'order_id' => $order->id,
            'invoice_number' => 'INV-20260725-TEST03',
        ]);

        $payload = [
            'order' => ['invoice_number' => 'INV-20260725-TEST03'],
            'transaction' => ['status' => 'EXPIRED'],
        ];

        $requestId = (string) Str::uuid();
        $timestamp = now()->utc()->format('Y-m-d\TH:i:s\Z');
        $signature = $this->generateSignature($payload, $timestamp, $requestId);

        $response = $this->postJson('/api/webhook/doku', $payload, [
            'Client-Id' => $this->clientId,
            'Request-Id' => $requestId,
            'Request-Timestamp' => $timestamp,
            'Signature' => $signature,
        ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('payments', [
            'id' => $payment->id,
            'status' => 'expired',
        ]);
    }

    public function test_check_payment_status_returns_paid_for_completed_orders(): void
    {
        $token = Str::random(64);
        $order = Order::factory()->create([
            'payment_status' => 'paid',
            'customer_access_token' => $token,
        ]);

        $response = $this->postJson('/api/customer/payment/qris/check-status', [
            'order_id' => $order->id,
            'customer_token' => $token,
        ]);

        $response->assertStatus(200)
            ->assertJson(['status' => 'paid']);
    }
}
