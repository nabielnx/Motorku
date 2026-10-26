<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\InventoryLogType;
use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Models\Order;
use App\Models\Product;
use Illuminate\Support\Facades\DB;

class OrderCancellationService
{
    public function __construct(private InventoryService $inventoryService) {}

    public function cancelForCustomer(string $orderId, string $token): array
    {
        return DB::transaction(function () use ($orderId, $token) {
            $order = Order::whereKey($orderId)->lockForUpdate()->first();
            if (! $order || ! $order->customer_access_token || ! hash_equals($order->customer_access_token, $token)) {
                return ['outcome' => 'invalid_token'];
            }
            if ($order->order_status === OrderStatus::Cancelled) {
                return ['outcome' => 'already_cancelled'];
            }
            if ($order->payment_review_requested_at) {
                return ['outcome' => 'under_review'];
            }
            if ($order->payment_status === PaymentStatus::Paid || $order->order_status !== OrderStatus::Pending) {
                return ['outcome' => 'not_pending'];
            }

            $this->markCancelled($order, 'customer');
            $this->releaseReservation($order, null,
                'Stok dikembalikan — order '.$order->order_number.' dibatalkan oleh customer');

            return ['outcome' => 'cancelled', 'order' => $order];
        });
    }

    public function expire(string $orderId): bool
    {
        return DB::transaction(function () use ($orderId) {
            $order = Order::whereKey($orderId)->lockForUpdate()->first();
            if (! $order || ! Order::stale()->whereKey($orderId)->exists()) {
                return false;
            }

            $this->restoreReservedStock($order, null,
                'Stok dikembalikan — order '.$order->order_number.' kadaluarsa otomatis');
            $reviewExpired = $order->payment_review_requested_at !== null;
            $this->markCancelled($order, $reviewExpired ? 'payment_review_expired' : 'expired');
            if ($reviewExpired) {
                $order->update([
                    'payment_review_requested_at' => null,
                    'payment_review_note' => 'Pemeriksaan QRIS melewati 24 jam. Pesanan dibatalkan dan stok dikembalikan. Jika dana sudah masuk, hubungi toko untuk rekonsiliasi.',
                ]);
            }
            $order->payments()->where('status', 'pending')->update(['status' => 'expired']);

            return true;
        });
    }

    // The caller owns the transaction and holds the order row lock.
    public function releaseReservation(Order $order, ?string $actorId, string $note): void
    {
        $this->restoreReservedStock($order, $actorId, $note);
        $order->payments()->where('status', 'pending')->update(['status' => 'cancelled']);
    }

    public function restoreReservedStock(Order $order, ?string $actorId, string $note): void
    {
        $order->loadMissing('items');
        foreach ($order->items as $item) {
            // Deleted catalogue items retain their invoice snapshot, but have no stock to restore.
            if (! $item->product_id || ! Product::whereKey($item->product_id)->lockForUpdate()->first(['id'])) {
                continue;
            }
            $this->inventoryService->adjustStock([
                'product_id' => $item->product_id,
                'type' => InventoryLogType::StockReturn,
                'quantity' => $item->quantity,
                'reference_type' => Order::class,
                'reference_id' => $order->id,
            ], $actorId, $note);
        }
    }

    private function markCancelled(Order $order, string $reason): void
    {
        $order->update([
            'order_status' => OrderStatus::Cancelled,
            'cancel_reason' => $reason,
            'sync_version' => $order->sync_version + 1,
        ]);
    }
}
