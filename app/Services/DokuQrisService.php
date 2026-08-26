<?php

namespace App\Services;

use App\Contracts\PaymentGatewayInterface;
use App\Models\Order;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class DokuQrisService implements PaymentGatewayInterface
{
    private string $clientId;
    private string $sharedKey;
    private string $baseUrl;

    public function __construct()
    {
        $this->clientId = config('doku.client_id');
        $this->sharedKey = config('doku.shared_key');
        $this->baseUrl = config('doku.base_url');
    }

    private function requestSignature(string $target, string $timestamp, string $requestId): string
    {
        $raw = "Client-Id:{$this->clientId}\nRequest-Id:{$requestId}\nRequest-Timestamp:{$timestamp}\nRequest-Target:{$target}";
        return 'HMACSHA256=' . base64_encode(hash_hmac('sha256', $raw, $this->sharedKey, true));
    }

    private function signature(string $method, string $target, string $timestamp, string $requestId, string $body): string
    {
        $digest = base64_encode(hash('sha256', $body, true));
        $raw = "Client-Id:{$this->clientId}\nRequest-Id:{$requestId}\nRequest-Timestamp:{$timestamp}\nRequest-Target:{$target}\nDigest:{$digest}";
        return 'HMACSHA256=' . base64_encode(hash_hmac('sha256', $raw, $this->sharedKey, true));
    }

    public function checkStatus(string $invoiceNumber): ?array
    {
        $requestId = (string) Str::uuid();
        $timestamp = now()->utc()->format('Y-m-d\TH:i:s\Z');
        $target = '/orders/v1/status/' . $invoiceNumber;
        $signature = $this->requestSignature($target, $timestamp, $requestId);

        $response = Http::withHeaders([
            'Client-Id' => $this->clientId,
            'Request-Id' => $requestId,
            'Request-Timestamp' => $timestamp,
            'Signature' => $signature,
        ])->timeout(15)->get($this->baseUrl . $target);

        if ($response->failed()) {
            Log::warning('Doku Check Status error', [
                'status' => $response->status(),
                'body' => $response->body(),
                'invoice' => $invoiceNumber,
            ]);
            return null;
        }

        return $response->json();
    }

    public function requestPaymentUrl(Order $order): array
    {
        $requestId = (string) Str::uuid();
        $timestamp = now()->utc()->format('Y-m-d\TH:i:s\Z');
        $invoiceNumber = $this->nextInvoiceNumber();

        $body = [
            'order' => [
                'amount' => (int) round($order->total),
                'invoice_number' => $invoiceNumber,
                'currency' => 'IDR',
                'auto_redirect' => true,
                'callback_url' => url('/order/waiting'),
                'callback_url_result' => url('/order/waiting'),
            ],
            'payment' => [
                'payment_due_date' => 60,
            ],
            'customer' => [
                'name' => $order->customer_name ?? 'Customer',
            ],
        ];

        $bodyJson = json_encode($body);
        $signature = $this->signature('POST', '/checkout/v1/payment', $timestamp, $requestId, $bodyJson);

        $response = Http::withHeaders([
            'Content-Type' => 'application/json',
            'Client-Id' => $this->clientId,
            'Request-Id' => $requestId,
            'Request-Timestamp' => $timestamp,
            'Signature' => $signature,
        ])->timeout(15)->post($this->baseUrl . '/checkout/v1/payment', $body);

        if ($response->failed()) {
            Log::error('Doku Checkout error', [
                'status' => $response->status(),
                'body' => $response->body(),
                'order_id' => $order->id,
            ]);
            $errorMsg = $response->json('error_messages')[0] ?? 'Gagal terhubung ke server pembayaran';
            throw new \RuntimeException('Gagal membuat halaman pembayaran: ' . $errorMsg);
        }

        $result = $response->json();
        $payment = $result['response']['payment'] ?? $result['payment'] ?? [];
        $paymentUrl = $payment['url'] ?? $payment['checkout_url'] ?? null;
        $tokenId = $payment['token_id'] ?? $payment['session_id'] ?? null;

        if (!$paymentUrl) {
            throw new \RuntimeException('Gagal mendapatkan URL pembayaran dari Doku');
        }

        $payment = DB::transaction(function () use ($order, $invoiceNumber, $result, $tokenId) {
            return Payment::create([
                'order_id' => $order->id,
                'payment_method' => 'qris',
                'payment_channel' => 'doku_checkout',
                'amount' => $order->total,
                'invoice_number' => $invoiceNumber,
                'status' => 'pending',
                'gateway_reference' => $tokenId,
                'expired_at' => now()->addMinutes(60),
                'raw_response' => $result,
            ]);
        });

        return [
            'payment_id' => $payment->id,
            'payment_url' => $paymentUrl,
            'token_id' => $tokenId,
            'invoice_number' => $invoiceNumber,
            'expired_at' => $payment->expired_at,
        ];
    }

    public function validateWebhook(Request $request): ?array
    {
        $signature = $request->header('Signature');
        $timestamp = $request->header('Request-Timestamp');
        $clientId = $request->header('Client-Id');

        if (!$signature || !$timestamp || !$clientId) {
            return null;
        }

        if ($clientId !== $this->clientId) {
            return null;
        }

        $body = $request->getContent();
        $digest = base64_encode(hash('sha256', $body, true));
        $target = '/' . $request->path();
        $raw = "Client-Id:{$this->clientId}\nRequest-Id:{$request->header('Request-Id')}\nRequest-Timestamp:{$timestamp}\nRequest-Target:{$target}\nDigest:{$digest}";
        $expected = 'HMACSHA256=' . base64_encode(hash_hmac('sha256', $raw, $this->sharedKey, true));

        if (!hash_equals($expected, $signature)) {
            Log::warning('Doku webhook signature mismatch');
            return null;
        }

        return $request->all();
    }

    public function processWebhook(array $payload): void
    {
        $invoiceNumber = $payload['order']['invoice_number'] ?? null;
        $transactionStatus = $payload['transaction']['status'] ?? null;

        if (!$invoiceNumber || !$transactionStatus) {
            Log::warning('Doku webhook missing fields', ['payload' => $payload]);
            return;
        }

        $payment = Payment::where('invoice_number', $invoiceNumber)
            ->where('status', 'pending')
            ->first();

        if (!$payment) {
            Log::warning('Doku webhook no matching payment', ['invoice' => $invoiceNumber]);
            return;
        }

        if ($transactionStatus === 'SUCCESS') {
            app(PaymentService::class)->updatePaymentStatus($payment->id, 'paid');
            Log::info('Doku payment success', ['payment_id' => $payment->id]);
        } elseif (in_array($transactionStatus, ['FAILED', 'EXPIRED'])) {
            $newStatus = $transactionStatus === 'FAILED' ? 'failed' : 'expired';
            DB::transaction(function () use ($payment, $newStatus) {
                $payment->update(['status' => $newStatus]);
            });
        }
    }

    private function nextInvoiceNumber(): string
    {
        $dateKey = now()->format('Ymd');
        if (DB::connection()->getDriverName() === 'pgsql') {
            DB::select('SELECT pg_advisory_xact_lock(?)', [crc32('spare-part-invoice-' . $dateKey)]);
        }

        $sequence = Payment::whereDate('created_at', now()->toDateString())->count() + 1;

        do {
            $invoice = 'INV-' . $dateKey . '-' . str_pad((string) $sequence++, 4, '0', STR_PAD_LEFT);
        } while (Payment::where('invoice_number', $invoice)->exists());

        return $invoice;
    }
}
