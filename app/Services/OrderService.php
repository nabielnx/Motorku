<?php

namespace App\Services;

use App\Enums\InventoryLogType;
use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Setting;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class OrderService
{
    public function __construct(
        protected InventoryService $inventoryService
    ) {}

    public function getAllOrders(?int $perPage = null, ?string $status = null, ?string $search = null)
    {
        $query = Order::with(['items', 'cashier'])->latest();

        if ($status && $status !== 'All') {
            $query->where('order_status', $status);
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('order_number', 'like', "%{$search}%")
                  ->orWhere('customer_name', 'like', "%{$search}%");
            });
        }

        return $perPage ? $query->paginate($perPage) : $query->get();
    }

    public function createOrder(array $data, bool $forcePublic = false)
    {
        if (empty(trim($data['customer_name'] ?? ''))) {
            throw ValidationException::withMessages([
                'customer_name' => ['Nama pelanggan wajib diisi.'],
            ]);
        }

        return DB::transaction(function () use ($data, $forcePublic) {
            $isPublicOrder = $forcePublic || !auth()->check();
            $subtotal = 0.0;
            $orderItemsData = [];
            $stockDeductions = [];

            foreach ($data['items'] as $item) {
                $product = Product::whereKey($item['product_id'])->lockForUpdate()->firstOrFail();
                $quantity = (int) $item['quantity'];

                if (!$product->is_available) {
                    throw ValidationException::withMessages([
                        'items' => "Produk {$product->name} sedang tidak tersedia.",
                    ]);
                }

                if ((float) $product->stock < $quantity) {
                    throw ValidationException::withMessages([
                        'items' => "Stok {$product->name} tidak mencukupi.",
                    ]);
                }

                $itemNotes = $item['notes'] ?? null;
                $unitPrice = (float) $product->price;
                $itemSubtotal = round($unitPrice * $quantity, 2);
                $subtotal += $itemSubtotal;

                $stockDeductions[] = [
                    'product_id' => $product->id,
                    'quantity'   => $quantity,
                ];

                $orderItemsData[] = [
                    'id' => (string) Str::uuid(),
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'product_sku' => $product->sku,
                    'unit_price' => $unitPrice,
                    'quantity' => $quantity,
                    'subtotal' => $itemSubtotal,
                    'notes' => $itemNotes,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }

            $taxEnabled = filter_var($this->setting('tax', 'enabled', 'true'), FILTER_VALIDATE_BOOLEAN);
            $taxRate = (float) $this->setting('tax', 'percentage', 0) / 100;

            $taxAmount = $taxEnabled ? round($subtotal * $taxRate, 2) : 0;
            $discountAmount = (float) ($data['discount_amount'] ?? 0);
            $total = max(0, $subtotal - $discountAmount + $taxAmount);
            $orderNumber = $this->nextOrderNumber();

            $order = Order::create([
                'order_number' => $orderNumber,
                'cashier_id' => $isPublicOrder ? null : auth()->id(),
                'customer_name' => $data['customer_name'] ?? null,
                'customer_access_token' => $isPublicOrder ? Str::random(64) : null,
                'order_type' => 'take_away', // Toko sparepart: semua order = ambil di toko
                'notes' => $data['notes'] ?? null,
                'subtotal' => $subtotal,
                'tax_amount' => $taxAmount,
                'total' => $total,
                'order_status' => OrderStatus::Pending,
                'payment_status' => PaymentStatus::Unpaid,
                'ordered_at' => now(),
                'expires_at' => now()->addMinutes(config('order.expiry_minutes', 60)),
            ]);

            foreach ($orderItemsData as &$itemData) {
                $itemData['order_id'] = $order->id;
            }
            unset($itemData);
            OrderItem::insert($orderItemsData);

            // BR-INV-001: All stock mutations go through InventoryService
            $userId = $isPublicOrder ? null : auth()->id();
            foreach ($stockDeductions as $deduction) {
                $this->inventoryService->adjustStock(
                    [
                        'product_id' => $deduction['product_id'],
                        'type'       => InventoryLogType::StockOut,
                        'quantity'   => $deduction['quantity'],
                    ],
                    $userId,
                    'Terjual via order ' . $order->order_number
                );
            }

            return $order->load(['items', 'cashier']);
        });
    }

    public function getOrderById($id, bool $forUpdate = false)
    {
        $query = Order::with(['items', 'cashier', 'payments']);

        if ($forUpdate) {
            $query->lockForUpdate();
        }

        if (Str::isUuid((string) $id)) {
            return $query->whereKey($id)->first();
        }

        return $query->where('order_number', $id)->first();
    }

    public function deleteOrder($id): void
    {
        $order = $this->getOrderById($id);
        if ($order) {
            if (!in_array($order->order_status, [OrderStatus::Cancelled, OrderStatus::Completed])) {
                $this->restoreReservedStock($order);
            }
            $order->delete();
        }
    }

    public function updateOrderStatus($id, array $data)
    {
        return DB::transaction(function () use ($id, $data) {
            $order = $this->getOrderById($id, true);
            if (!$order) {
                abort(404);
            }

            $nextStatusRaw = $data['order_status'] ?? null;
            $nextStatus = $nextStatusRaw
                ? ($nextStatusRaw instanceof OrderStatus ? $nextStatusRaw : OrderStatus::from($nextStatusRaw))
                : null;

            if ($nextStatus === OrderStatus::Cancelled) {
                if (!auth()->user() || !auth()->user()->hasRole('owner')) {
                    abort(403, 'Hanya owner yang dapat membatalkan pesanan.');
                }

                if ($order->order_status !== OrderStatus::Pending) {
                    throw ValidationException::withMessages([
                        'order_status' => 'Pesanan hanya dapat dibatalkan jika masih berstatus pending.',
                    ]);
                }
            }

            if ($nextStatus && $nextStatus !== OrderStatus::Cancelled && $order->payment_status !== PaymentStatus::Paid) {
                throw ValidationException::withMessages([
                    'payment_status' => 'Pesanan belum dibayar. Lakukan pembayaran terlebih dahulu sebelum memproses pesanan.',
                ]);
            }

            $currentStatus = $order->order_status instanceof OrderStatus
                ? $order->order_status
                : OrderStatus::from($order->order_status);

            if ($nextStatus && !$currentStatus->canTransitionTo($nextStatus)) {
                throw ValidationException::withMessages([
                    'order_status' => "Transisi {$currentStatus->value} ke {$nextStatus->value} tidak valid.",
                ]);
            }

            if ($nextStatus === OrderStatus::Cancelled && $order->order_status !== OrderStatus::Cancelled) {
                $this->restoreReservedStock($order);
            }

            // Convert enum to string for the update array
            $updateData = $data;
            if (isset($updateData['order_status']) && $updateData['order_status'] instanceof OrderStatus) {
                $updateData['order_status'] = $updateData['order_status']->value;
            }

            $order->update(array_merge($updateData, [
                'sync_version' => $order->sync_version + 1,
            ]));

            return $order->fresh(['items', 'cashier']);
        });
    }

    private function nextOrderNumber(): string
    {
        $dateKey = now()->format('Ymd');
        // Serialize the daily counter on PostgreSQL. Unlike FOR UPDATE on a
        // COUNT aggregate, an advisory transaction lock also works when the
        // first order of the day is being created concurrently.
        if (DB::connection()->getDriverName() === 'pgsql') {
            DB::select('SELECT pg_advisory_xact_lock(?)', [crc32('spare-part-order-' . $dateKey)]);
        }

        $sequence = Order::whereDate('created_at', now()->toDateString())->count() + 1;

        do {
            $orderNumber = 'ORD-' . $dateKey . '-' . str_pad((string) $sequence++, 4, '0', STR_PAD_LEFT);
        } while (Order::where('order_number', $orderNumber)->exists());

        return $orderNumber;
    }

    /**
     * Restore stock for a cancelled/deleted order via InventoryService.
     */
    private function restoreReservedStock(Order $order): void
    {
        $order->loadMissing('items');

        foreach ($order->items as $item) {
            $this->inventoryService->adjustStock(
                [
                    'product_id' => $item->product_id,
                    'type'       => InventoryLogType::StockIn,
                    'quantity'   => $item->quantity,
                ],
                auth()->id(),
                'Stok dikembalikan — order ' . $order->order_number . ' dibatalkan'
            );
        }
    }

    private function setting(string $group, string $key, mixed $default): mixed
    {
        return Setting::where('group', $group)->where('key', $key)->value('value') ?? $default;
    }
}
