<?php

namespace App\Services;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Events\OrderStatusUpdated;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Setting;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class PaymentService
{
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
                || ! Setting::where('group', 'store')->where('key', 'qris_image')->whereNotNull('value')->exists()
            )) {
                throw ValidationException::withMessages(['payment_method' => 'Gambar QRIS toko belum tersedia atau QRIS dinonaktifkan.']);
            }

            if ($order->order_status === OrderStatus::Cancelled) {
                throw ValidationException::withMessages(['order_id' => 'Pesanan yang dibatalkan tidak bisa dibayar.']);
            }

            if ($order->payment_status === PaymentStatus::Paid || $order->payments()->where('status', 'paid')->exists()) {
                throw ValidationException::withMessages(['order_id' => 'Pesanan ini sudah lunas atau memiliki pembayaran aktif yang telah dikonfirmasi.']);
            }

            // Cancel any previous pending payments for this order (e.g. pending QRIS attempt)
            $order->payments()->where('status', 'pending')
                ->where(function ($query) {
                    $query->whereNull('payment_channel')->orWhere('payment_channel', '!=', 'doku_checkout');
                })->update(['status' => 'cancelled']);

            $amountDue = (float) $order->total;
            $amountReceived = $method === 'cash' ? (float) ($data['amount_received'] ?? 0) : $amountDue;
            if ($method === 'cash' && $amountReceived < $amountDue) {
                throw ValidationException::withMessages(['amount_received' => 'Nominal pembayaran kurang dari total pesanan.']);
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
        });
    }

    public function nextInvoiceNumber(): string
    {
        $dateKey = now()->format('Ymd');
        $driver = DB::connection()->getDriverName();
        $lockKey = 'spare-part-invoice-'.$dateKey;

        if ($driver === 'pgsql') {
            DB::select('SELECT pg_advisory_xact_lock(?)', [crc32($lockKey)]);
        } elseif ($driver === 'mysql') {
            DB::select('SELECT GET_LOCK(?, 10)', [$lockKey]);
        }

        try {
            $sequence = Payment::whereDate('created_at', now()->toDateString())->count() + 1;

            do {
                $invoice = 'INV-'.$dateKey.'-'.str_pad((string) $sequence++, 4, '0', STR_PAD_LEFT);
            } while (Payment::where('invoice_number', $invoice)->exists());

            return $invoice;
        } finally {
            if ($driver === 'mysql') {
                DB::select('SELECT RELEASE_LOCK(?)', [$lockKey]);
            }
        }
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
            $payment = Payment::whereKey($id)->lockForUpdate()->firstOrFail();
            $order = Order::whereKey($payment->order_id)->lockForUpdate()->first();

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
            if ($status === 'paid' && $order && $order->payment_status === PaymentStatus::Paid) {
                throw ValidationException::withMessages([
                    'order_id' => 'Pesanan ini sudah lunas. Pembayaran ganda tidak diizinkan.',
                ]);
            }

            $payment->update([
                'status' => $status,
                'paid_at' => $status === 'paid' ? now() : $payment->paid_at,
            ]);

            if ($order) {
                if ($status === 'paid') {
                    $this->finalizePaidOrder($order);
                } else {
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

        try {
            OrderStatusUpdated::dispatch($order->fresh(['items', 'cashier']));
        } catch (\Throwable $e) {
            Log::warning('OrderStatusUpdated broadcast gagal (Reverb offline/unreachable): '.$e->getMessage());
        }
    }
}
