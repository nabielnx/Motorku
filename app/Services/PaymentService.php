<?php

namespace App\Services;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Setting;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PaymentService
{
    public function __construct(
        private DocumentNumberService $documentNumbers,
        private CashClosingService $cashClosing
    ) {}

    public function processPayment(array $data)
    {
        return DB::transaction(function () use ($data) {
            $order = Order::whereKey($data['order_id'])->lockForUpdate()->firstOrFail();

            $method = $data['payment_method'] ?? null;
            if (! in_array($method, ['cash', 'qris_manual'], true)) {
                throw ValidationException::withMessages([
                    'payment_method' => 'Metode pembayaran tidak didukung.',
                ]);
            }

            if ($method === 'qris_manual' && (
                Setting::where('group', 'payment')->where('key', 'qris_enabled')->value('value') === 'false'
                || blank(Setting::where('group', 'store')->where('key', 'qris_image')->value('value'))
            )) {
                throw ValidationException::withMessages(['payment_method' => 'Gambar QRIS toko belum tersedia atau QRIS dinonaktifkan.']);
            }

            if ($order->order_status === OrderStatus::Cancelled) {
                throw ValidationException::withMessages(['order_id' => 'Pesanan yang dibatalkan tidak bisa dibayar.']);
            }

            if ($order->payment_status !== PaymentStatus::Unpaid || $order->payments()->where('status', 'paid')->exists()) {
                throw ValidationException::withMessages(['order_id' => 'Pesanan ini sudah lunas atau memiliki pembayaran aktif yang telah dikonfirmasi.']);
            }

            // Cancel any previous pending payments for this order (e.g. pending QRIS attempt)
            $order->payments()->where('status', 'pending')->update(['status' => 'cancelled']);

            $amountDue = (float) $order->total;
            $amountReceived = $method === 'cash' ? (float) ($data['amount_received'] ?? 0) : $amountDue;
            if ($method === 'cash' && $amountReceived < $amountDue) {
                throw ValidationException::withMessages(['amount_received' => 'Nominal pembayaran kurang dari total pesanan.']);
            }

            if ($method === 'cash') {
                $this->cashClosing->assertCashDayOpen(now()->toDateString());
            }

            $payment = Payment::create([
                'order_id' => $data['order_id'],
                'payment_method' => $method,
                'payment_channel' => $method === 'qris_manual' ? 'manual_qris' : null,
                'amount' => $amountDue,
                'amount_received' => $amountReceived,
                'change_amount' => $method === 'cash' ? max(0, $amountReceived - $amountDue) : 0,
                'reference_number' => $method === 'qris_manual' ? ($data['reference_number'] ?? null) : null,
                'invoice_number' => $this->nextInvoiceNumber(),
                'notes' => $data['notes'] ?? null,
                'status' => 'paid',
                'user_id' => auth()->id(),
                'paid_at' => now(),
            ]);

            $this->finalizePaidOrder($order);

            return $payment->load('order');
        }, 3);
    }

    public function nextInvoiceNumber(): string
    {
        return $this->documentNumbers->next('invoice');
    }

    public function getAllPayments(?int $perPage = null)
    {
        $query = Payment::with('order')->latest();

        return $perPage ? $query->paginate($perPage) : $query->get();
    }

    public function getPaymentById($id)
    {
        return Payment::with('order')->findOrFail($id);
    }

    public function updatePaymentStatus($id, $status)
    {
        return DB::transaction(function () use ($id, $status) {
            $orderId = Payment::findOrFail($id)->order_id;
            // Always lock the order before its payment, as processPayment does.
            $order = Order::whereKey($orderId)->lockForUpdate()->firstOrFail();
            $payment = Payment::whereKey($id)->lockForUpdate()->firstOrFail();

            $allowed = match ($payment->status) {
                'pending' => ['paid', 'failed', 'expired', 'cancelled'],
                'paid' => [],
                default => [],
            };

            if (! in_array($status, $allowed, true)) {
                throw ValidationException::withMessages([
                    'status' => "Status pembayaran tidak bisa diubah dari {$payment->status} menjadi {$status}.",
                ]);
            }

            // Guard idempotency: jika order sudah lunas via payment lain,
            // tolak finalisasi ganda untuk mencegah double-charge.
            if ($status === 'paid' && ($order->payment_status !== PaymentStatus::Unpaid || $order->payments()->where('status', 'paid')->exists())) {
                throw ValidationException::withMessages([
                    'order_id' => 'Pesanan ini sudah lunas. Pembayaran ganda tidak diizinkan.',
                ]);
            }

            if ($status === 'paid') {
                if ($order->order_status === OrderStatus::Cancelled) {
                    throw ValidationException::withMessages(['order_id' => 'Pesanan yang dibatalkan tidak bisa dibayar.']);
                }
                if (! in_array($payment->payment_method, ['cash', 'qris_manual'], true)) {
                    throw ValidationException::withMessages(['payment_method' => 'Metode pembayaran tidak didukung.']);
                }
                if ((float) $payment->amount !== (float) $order->total || (float) $payment->amount_received < (float) $order->total) {
                    throw ValidationException::withMessages(['amount_received' => 'Nominal pembayaran tidak sesuai tagihan. Buat pembayaran baru.']);
                }
                if ($payment->payment_method === 'cash') {
                    $this->cashClosing->assertCashDayOpen(now()->toDateString());
                } elseif (Setting::where('group', 'payment')->where('key', 'qris_enabled')->value('value') === 'false'
                    || blank(Setting::where('group', 'store')->where('key', 'qris_image')->value('value'))) {
                    throw ValidationException::withMessages(['payment_method' => 'QRIS toko belum tersedia atau dinonaktifkan.']);
                }
            }

            $payment->update([
                'status' => $status,
                'paid_at' => $status === 'paid' ? now() : $payment->paid_at,
            ]);

            if ($order) {
                if ($status === 'paid') {
                    $this->finalizePaidOrder($order);
                } elseif ($order->payment_status !== PaymentStatus::Refunded && ! $order->payments()->where('status', 'paid')->exists()) {
                    $order->update([
                        'payment_status' => match ($status) {
                            'refunded' => PaymentStatus::Refunded,
                            default => PaymentStatus::Unpaid,
                        },
                        'sync_version' => $order->sync_version + 1,
                    ]);
                }
            }

            return $payment->fresh(['order']);
        });
    }

    /**
     * Finalize an order when payment is marked as paid:
     * 1. Update Order: payment_status = 'paid'
     * (Order status remains pending/preparing/ready until staff complete the order flow)
     */
    public function finalizePaidOrder(Order $order): void
    {
        $order->update([
            'payment_status' => PaymentStatus::Paid,
            'order_status' => $order->customer_access_token && $order->order_status === OrderStatus::Pending
                ? OrderStatus::Preparing
                : $order->order_status,
            'sync_version' => $order->sync_version + 1,
        ]);

    }
}
