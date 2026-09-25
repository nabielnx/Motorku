<?php

namespace App\Services;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Events\OrderStatusUpdated;
use App\Models\Order;
use App\Models\Payment;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class PaymentService
{
    public function processPayment(array $data)
    {
        return DB::transaction(function () use ($data) {
            $order = Order::whereKey($data['order_id'])->lockForUpdate()->firstOrFail();

            if (($data['payment_method'] ?? null) !== 'cash') {
                throw ValidationException::withMessages([
                    'payment_method' => 'Hanya metode pembayaran tunai (cash) yang diperbolehkan.',
                ]);
            }

            if ($order->order_status === OrderStatus::Cancelled) {
                throw ValidationException::withMessages(['order_id' => 'Pesanan yang dibatalkan tidak bisa dibayar.']);
            }

            if ($order->payment_status === PaymentStatus::Paid || $order->payments()->where('status', 'paid')->exists()) {
                throw ValidationException::withMessages(['order_id' => 'Pesanan ini sudah lunas atau memiliki pembayaran aktif yang telah dikonfirmasi.']);
            }

            // Cancel any previous pending payments for this order (e.g. pending QRIS attempt)
            $order->payments()->where('status', 'pending')->update(['status' => 'cancelled']);

            $amountReceived = (float) ($data['amount_received'] ?? 0);
            $amountDue = (float) $order->total;
            if ($amountReceived < $amountDue) {
                throw ValidationException::withMessages(['amount_received' => 'Nominal pembayaran kurang dari total pesanan.']);
            }

            $payment = Payment::create([
                'order_id' => $data['order_id'],
                'payment_method' => 'cash',
                'amount' => $amountDue,
                'amount_received' => $amountReceived,
                'change_amount' => max(0, $amountReceived - $amountDue),
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
     * (Order status remains pending/preparing/ready until kitchen & cashier complete operational flow)
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
