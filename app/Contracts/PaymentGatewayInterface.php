<?php

namespace App\Contracts;

use App\Models\Order;
use Illuminate\Http\Request;

interface PaymentGatewayInterface
{
    /**
     * Request a payment URL for the given order.
     *
     * @return array{payment_id: string, payment_url: string, token_id: ?string, invoice_number: string, expired_at: mixed}
     */
    public function requestPaymentUrl(Order $order): array;

    /**
     * Check the payment status for the given invoice number.
     */
    public function checkStatus(string $invoiceNumber): ?array;

    /**
     * Validate an incoming webhook request. Returns the parsed payload or null if invalid.
     */
    public function validateWebhook(Request $request): ?array;

    /**
     * Process a validated webhook payload (update payment status, etc.).
     */
    public function processWebhook(array $payload): void;
}
