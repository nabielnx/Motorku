<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Models\Order;
use App\Models\Setting;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CustomerOrderService
{
    public function authorizedOrder(string $id, ?string $token, bool $lock = false): Order
    {
        $order = Order::whereKey($id)->when($lock, fn ($query) => $query->lockForUpdate())->first();
        abort_unless($token && $order?->customer_access_token && hash_equals($order->customer_access_token, $token), 401, 'Pesanan atau token tidak valid.');

        return $order;
    }

    public function assertQrisAvailable(float $total): void
    {
        if (Setting::where('group', 'payment')->where('key', 'qris_enabled')->value('value') === 'false'
            || blank(Setting::where('group', 'store')->where('key', 'qris_image')->value('value'))
            || $total <= 0 || $total > 10000000) {
            throw ValidationException::withMessages(['payment_preference' => 'QRIS tidak tersedia untuk pesanan ini. Pilih bayar di kasir.']);
        }
    }

    public function reportPayment(string $id, string $token, ?string $reference): Order
    {
        return DB::transaction(function () use ($id, $token, $reference) {
            $order = $this->authorizedOrder($id, $token, true);
            if ($order->payment_review_requested_at) {
                return $order; // Repeated requests do not change the original report.
            }
            if ($order->payment_status !== PaymentStatus::Unpaid || $order->order_status !== OrderStatus::Pending || $order->expires_at?->isPast()) {
                throw ValidationException::withMessages(['order' => 'Status pesanan berubah. Perbarui status atau hubungi toko bila sudah membayar.']);
            }
            $this->assertQrisAvailable((float) $order->total);
            $order->update([
                'payment_preference' => 'qris',
                'payment_review_requested_at' => now(),
                'payment_reference' => $reference ? trim($reference) : null,
                'payment_review_note' => null,
                'sync_version' => $order->sync_version + 1,
            ]);

            return $order;
        }, 3);
    }

    public function rejectPayment(string $id, string $reason): Order
    {
        return DB::transaction(function () use ($id, $reason) {
            $order = Order::whereKey($id)->lockForUpdate()->firstOrFail();
            if (! $order->payment_review_requested_at || $order->payment_status !== PaymentStatus::Unpaid || $order->order_status !== OrderStatus::Pending) {
                throw ValidationException::withMessages(['order' => 'Laporan sudah diproses. Muat ulang daftar pesanan.']);
            }
            $order->update([
                'payment_review_requested_at' => null,
                'payment_review_note' => trim($reason),
                'expires_at' => now()->addMinutes(config('order.expiry_minutes', 15)),
                'sync_version' => $order->sync_version + 1,
            ]);

            return $order;
        }, 3);
    }

    public function snapshot(Order $order): array
    {
        $order->loadMissing(['items', 'payments', 'returns.item']);
        $payment = $order->payments->firstWhere('status', 'paid') ?? $order->payments->firstWhere('status', 'refunded');

        return [
            'id' => $order->id, 'order_number' => $order->order_number,
            'order_status' => $order->order_status, 'payment_status' => $order->payment_status,
            'customer_name' => $order->customer_name, 'pickup_label' => 'Ambil di Toko',
            'subtotal' => (float) $order->subtotal, 'discount_amount' => (float) $order->discount_amount,
            'tax_amount' => (float) $order->tax_amount, 'total' => (float) $order->total,
            'ordered_at' => $order->ordered_at?->toIso8601String() ?? $order->created_at?->toIso8601String(),
            'expires_at' => $order->expires_at?->toIso8601String(), 'cancel_reason' => $order->cancel_reason,
            'sync_version' => $order->sync_version, 'updated_at' => $order->updated_at?->toIso8601String(),
            'payment_preference' => $order->payment_preference,
            'payment_review_requested_at' => $order->payment_review_requested_at?->toIso8601String(),
            'payment_review_note' => $order->payment_review_note, 'payment_reference' => $order->payment_reference,
            'payment_method' => $payment?->payment_method, 'paid_at' => $payment?->paid_at?->toIso8601String(),
            'invoice_number' => $payment?->invoice_number,
            'refunded_amount' => (float) $order->returns->sum('amount'),
            'refunds' => $order->returns->map(fn ($refund) => [
                'id' => $refund->id, 'product_name' => $refund->item?->product_name ?? 'Produk',
                'quantity' => $refund->quantity, 'amount' => (float) $refund->amount,
                'method' => $refund->refund_method, 'reason' => $refund->reason,
                'created_at' => $refund->created_at?->toIso8601String(),
            ])->values()->all(),
            'items' => $order->items->map(fn ($item) => [
                'id' => $item->id, 'product_name' => $item->product_name ?? 'Produk',
                'unit_price' => (float) $item->unit_price, 'quantity' => (int) $item->quantity,
                'subtotal' => (float) $item->subtotal, 'notes' => $item->notes,
            ])->values()->all(),
        ];
    }
}
