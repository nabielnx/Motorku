<?php

namespace App\Services;

use App\Enums\InventoryLogType;
use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Models\Order;
use App\Models\OrderReturn;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OrderReturnService
{
    public function __construct(private InventoryService $inventoryService) {}

    public function returnItem(string $orderId, array $data): Order
    {
        return DB::transaction(function () use ($orderId, $data) {
            $order = Order::whereKey($orderId)->lockForUpdate()->firstOrFail();
            if ($order->returns()->where('request_id', $data['request_id'])->exists()) {
                return $order->fresh(['items', 'cashier', 'payments', 'returns.item']);
            }
            $item = $order->items()->whereKey($data['order_item_id'])->firstOrFail();

            if ($order->order_status === OrderStatus::Cancelled || ! $order->payments()
                ->where('payment_method', 'cash')->where('status', 'paid')->exists()) {
                throw ValidationException::withMessages(['order_id' => 'Retur hanya tersedia untuk transaksi tunai yang sudah lunas.']);
            }

            $returnedQty = (int) $order->returns()->where('order_item_id', $item->id)->sum('quantity');
            $quantity = (int) $data['quantity'];
            if ($quantity > $item->quantity - $returnedQty) {
                throw ValidationException::withMessages(['quantity' => 'Jumlah retur melebihi sisa barang pada struk.']);
            }

            $totalCents = (int) round((float) $order->total * 100);
            $subtotalCents = (int) round((float) $order->subtotal * 100);
            $lineCents = (int) round((float) $item->subtotal * 100);
            $priorRefundCents = (int) round((float) $order->returns()->sum('amount') * 100);
            $remainingCents = max(0, $totalCents - $priorRefundCents);
            $allReturned = $order->returns()->sum('quantity') + $quantity >= $order->items()->sum('quantity');
            $refundCents = $allReturned
                ? $remainingCents
                : min($remainingCents, $subtotalCents > 0
                    ? (int) round($totalCents * $lineCents / $subtotalCents * $quantity / $item->quantity)
                    : 0);

            $return = OrderReturn::create([
                'request_id' => $data['request_id'],
                'order_id' => $order->id,
                'order_item_id' => $item->id,
                'user_id' => auth()->id(),
                'quantity' => $quantity,
                'amount' => $refundCents / 100,
                'restocked' => (bool) $data['restock'],
                'reason' => $data['reason'],
            ]);

            if ($return->restocked) {
                $this->inventoryService->adjustStock([
                    'product_id' => $item->product_id,
                    'type' => InventoryLogType::StockReturn,
                    'quantity' => $quantity,
                    'reference_type' => OrderReturn::class,
                    'reference_id' => $return->id,
                ], auth()->id(), 'Retur '.$order->order_number);
            }

            $order->update([
                'payment_status' => $allReturned ? PaymentStatus::Refunded : PaymentStatus::Paid,
                'sync_version' => $order->sync_version + 1,
            ]);

            return $order->fresh(['items', 'cashier', 'payments', 'returns.item']);
        });
    }
}
