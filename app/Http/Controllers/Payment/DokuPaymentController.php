<?php

namespace App\Http\Controllers\Payment;

use App\Http\Controllers\Controller;
use App\Contracts\PaymentGatewayInterface;
use App\Enums\PaymentStatus;
use App\Models\Order;
use App\Services\PaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class DokuPaymentController extends Controller
{
    public function __construct(
        protected PaymentGatewayInterface $dokuQris
    ) {}

    /**
     * Poll status Doku untuk sebuah order dan kembalikan status kanonik.
     * Dipakai oleh endpoint customer (dengan token) dan staff POS (tanpa token).
     */
    private function pollPaymentStatus(Order $order): array
    {
        // Prioritaskan pending agar invoice yang sudah expired/failed tidak dipoll ulang.
        $payment = $order->payments()
            ->where('payment_channel', 'doku_checkout')
            ->orderByRaw("CASE WHEN status = 'pending' THEN 0 ELSE 1 END")
            ->latest()
            ->first();

        if (!$payment || !$payment->invoice_number) {
            return ['status' => 'unpaid'];
        }

        Log::debug('Doku check status called', [
            'invoice' => $payment->invoice_number,
            'payment_id' => $payment->id,
            'order_id' => $order->id,
        ]);

        $result = $this->dokuQris->checkStatus($payment->invoice_number);
        if (!$result) {
            Log::warning('Doku check status returned null');
            return ['status' => 'unknown'];
        }

        Log::debug('Doku check status response', ['result' => $result]);

        $transactionStatus = $result['transaction']['status'] ?? null;

        if ($transactionStatus === 'SUCCESS') {
            app(PaymentService::class)->updatePaymentStatus($payment->id, 'paid');
            return ['status' => 'paid'];
        }

        if (in_array($transactionStatus, ['FAILED', 'EXPIRED'])) {
            $newStatus = $transactionStatus === 'FAILED' ? 'failed' : 'expired';
            DB::transaction(function () use ($payment, $newStatus) {
                $payment->update(['status' => $newStatus]);
            });
            return ['status' => $newStatus];
        }

        return ['status' => 'pending'];
    }

    /**
     * Batalkan invoice doku_checkout pending lama agar tidak ada invoice ganda
     * yang bisa di-charge lebih dari sekali via webhook.
     */
    private function cancelPendingDokuInvoices(Order $order): void
    {
        $order->payments()
            ->where('payment_channel', 'doku_checkout')
            ->where('status', 'pending')
            ->update(['status' => 'cancelled']);
    }

    // ─── CUSTOMER FLOW (public, butuh customer_token) ───

    public function checkPaymentStatus(Request $request): JsonResponse
    {
        $data = $request->validate([
            'order_id' => ['required', 'uuid', 'exists:orders,id'],
            'customer_token' => ['required', 'string', 'size:64'],
        ]);

        $order = Order::whereKey($data['order_id'])
            ->where('customer_access_token', $data['customer_token'])
            ->first();

        if (!$order) {
            return response()->json(['message' => 'Order tidak ditemukan'], 404);
        }

        if ($order->payment_status === PaymentStatus::Paid) {
            return response()->json(['status' => 'paid']);
        }

        return response()->json($this->pollPaymentStatus($order));
    }

    public function createQrisPayment(Request $request): JsonResponse
    {
        $data = $request->validate([
            'order_id' => ['required', 'uuid', 'exists:orders,id'],
            'customer_token' => ['required', 'string', 'size:64'],
        ]);

        $order = Order::whereKey($data['order_id'])
            ->where('customer_access_token', $data['customer_token'])
            ->first();

        if (!$order) {
            return response()->json(['message' => 'Order tidak ditemukan'], 404);
        }

        if ($order->payment_status === PaymentStatus::Paid) {
            return response()->json(['message' => 'Pesanan ini sudah dibayar'], 422);
        }

        $this->cancelPendingDokuInvoices($order);

        try {
            $result = $this->dokuQris->requestPaymentUrl($order);
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 502);
        }

        return response()->json([
            'message' => 'Halaman pembayaran berhasil dibuat',
            'data' => $result,
        ]);
    }

    // ─── STAFF / POS FLOW (auth owner|cashier, tanpa customer_token) ───

    public function createPosQrisPayment(Request $request): JsonResponse
    {
        $data = $request->validate([
            'order_id' => ['required', 'uuid', 'exists:orders,id'],
        ]);

        $order = Order::whereKey($data['order_id'])->first();

        if (!$order) {
            return response()->json(['message' => 'Order tidak ditemukan'], 404);
        }

        if ($order->payment_status === PaymentStatus::Paid) {
            return response()->json(['message' => 'Pesanan ini sudah dibayar'], 422);
        }

        $this->cancelPendingDokuInvoices($order);

        try {
            $result = $this->dokuQris->requestPaymentUrl($order);
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 502);
        }

        return response()->json([
            'message' => 'Halaman pembayaran berhasil dibuat',
            'data' => $result,
        ]);
    }

    public function checkPosQrisPayment(Request $request): JsonResponse
    {
        $data = $request->validate([
            'order_id' => ['required', 'uuid', 'exists:orders,id'],
        ]);

        $order = Order::whereKey($data['order_id'])->first();

        if (!$order) {
            return response()->json(['message' => 'Order tidak ditemukan'], 404);
        }

        if ($order->payment_status === PaymentStatus::Paid) {
            return response()->json(['status' => 'paid']);
        }

        return response()->json($this->pollPaymentStatus($order));
    }

    public function handleWebhook(Request $request): JsonResponse
    {
        $payload = $this->dokuQris->validateWebhook($request);

        if ($payload === null) {
            return response()->json(['message' => 'Invalid signature'], 401);
        }

        $this->dokuQris->processWebhook($payload);

        return response()->json(['message' => 'OK']);
    }
}
