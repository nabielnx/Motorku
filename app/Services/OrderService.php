<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\InventoryLogType;
use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Events\OrderStatusUpdated;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Setting;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class OrderService
{
    private const ACTIVE_STATUSES = ['pending', 'preparing', 'ready'];

    public function __construct(
        protected InventoryService $inventoryService,
        protected PaymentService $paymentService
    ) {}

    public function createPosSale(array $data): array
    {
        return DB::transaction(function () use ($data) {
            $order = $this->createOrder($data);
            $order->update([
                'order_status' => OrderStatus::Completed,
                'expires_at' => null,
                'sync_version' => $order->sync_version + 1,
            ]);
            $payment = $this->paymentService->processPayment([
                'order_id' => $order->id,
                'payment_method' => 'cash',
                'amount_received' => $data['amount_received'],
                'notes' => 'Penjualan langsung POS',
            ]);

            return ['order' => $order->fresh(['items', 'cashier', 'payments']), 'payment' => $payment];
        });
    }

    public function getOrdersForWeb(?string $status = null, ?string $search = null, ?string $date = null)
    {
        $query = Order::with(['items', 'cashier', 'payments'])->withSum('returns', 'amount')->latest();

        if ($status === 'action') {
            $query->whereIn('order_status', self::ACTIVE_STATUSES);
        } elseif ($status && $status !== 'All') {
            $query->where('order_status', $status);
        }

        if ($date === 'today') {
            $query->where('created_at', '>=', now()->startOfDay());
        } elseif ($date === 'week') {
            $query->where('created_at', '>=', now()->subDays(6)->startOfDay());
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('order_number', 'like', "%{$search}%")
                    ->orWhere('customer_name', 'like', "%{$search}%")
                    ->orWhereHas('items', function ($items) use ($search) {
                        $items->where('product_name', 'like', "%{$search}%")
                            ->orWhere('product_sku', 'like', "%{$search}%");
                    });
            });
        }

        return $query->paginate(10)
            ->withQueryString()
            ->through(function ($order) use ($search) {
                return [
                    'id' => $order->order_number ?: substr($order->id, 0, 8),
                    'real_id' => $order->id,
                    'customer' => $order->customer_name ?: 'Walk-in Guest',
                    'channel' => $order->customer_access_token ? 'Online' : ($order->order_status === OrderStatus::Completed ? 'POS' : 'Kasir'),
                    'type' => 'Ambil di Toko',
                    'table' => '-',
                    'items' => $order->items ? $order->items->sum('quantity') : 0,
                    'matching_item' => $search ? $order->items->first(fn ($item) =>
                        stripos((string) $item->product_name, $search) !== false ||
                        stripos((string) $item->product_sku, $search) !== false
                    )?->product_name : null,
                    'total' => (float) $order->total,
                    'status' => $order->order_status,
                    'payment_status' => $order->payment_status,
                    'returned_amount' => (float) ($order->returns_sum_amount ?? 0),
                    'paid_at' => $order->payments
                        ->where('status', 'paid')
                        ->sortByDesc('paid_at')
                        ->first()?->paid_at?->toIso8601String(),
                    'created_at' => $order->created_at?->toIso8601String(),
                    'time' => $order->created_at ? $order->created_at->timezone('Asia/Jakarta')->format('H:i') : '-',
                    'date' => $order->created_at ? $order->created_at->timezone('Asia/Jakarta')->format('d M Y') : '-',
                ];
            });
    }

    public function countActiveOrders(): int
    {
        return Order::whereIn('order_status', self::ACTIVE_STATUSES)->count();
    }

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

        $result = DB::transaction(function () use ($data, $forcePublic) {
            $isPublicOrder = $forcePublic || ! auth()->check();
            $subtotal = 0.0;
            $orderItemsData = [];
            $stockDeductions = [];

            foreach ($data['items'] as $item) {
                $product = Product::whereKey($item['product_id'])->lockForUpdate()->firstOrFail();
                $quantity = (int) $item['quantity'];

                if (! $product->is_available) {
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
                    'quantity' => $quantity,
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
                        'type' => InventoryLogType::StockOut,
                        'quantity' => $deduction['quantity'],
                        'reference_type' => \App\Models\Order::class,
                        'reference_id' => $order->id,
                    ],
                    $userId,
                    'Terjual via order '.$order->order_number
                );
            }

            return $order->load(['items', 'cashier']);
        });

        CacheService::flushCatalog();

        return $result;
    }

    public function getOrderById($id, bool $forUpdate = false)
    {
        $query = Order::with(['items', 'cashier', 'payments', 'returns.item']);

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
        DB::transaction(function () use ($id) {
            $order = $this->getOrderById($id, true);
            if (! $order) {
                return;
            }

            if ($order->payment_status !== PaymentStatus::Unpaid
                || ! in_array($order->order_status, [OrderStatus::Pending, OrderStatus::Cancelled], true)) {
                throw ValidationException::withMessages(['order' => 'Transaksi yang sudah dibayar tidak dapat dihapus.']);
            }

            if ($order->order_status === OrderStatus::Pending) {
                $this->restoreReservedStock($order);
            }
            $order->delete();
        });
    }

    public function updateOrderStatus($id, array $data)
    {
        return DB::transaction(function () use ($id, $data) {
            $order = $this->getOrderById($id, true);
            if (! $order) {
                abort(404);
            }

            $nextStatusRaw = $data['order_status'] ?? null;
            $nextStatus = $nextStatusRaw
                ? ($nextStatusRaw instanceof OrderStatus ? $nextStatusRaw : OrderStatus::from($nextStatusRaw))
                : null;

            if ($nextStatus === OrderStatus::Cancelled) {
                if (! auth()->user() || ! auth()->user()->hasRole('owner')) {
                    abort(403, 'Hanya owner yang dapat membatalkan pesanan.');
                }

                if ($order->payment_status === PaymentStatus::Paid) {
                    throw ValidationException::withMessages([
                        'order_status' => 'Pesanan yang sudah dibayar tidak dapat dibatalkan.',
                    ]);
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

            if ($nextStatus && ! $currentStatus->canTransitionTo($nextStatus)) {
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

            $updatedOrder = $order->fresh(['items', 'cashier']);

            try {
                OrderStatusUpdated::dispatch($updatedOrder);
            } catch (\Throwable $e) {
                Log::warning('OrderStatusUpdated broadcast gagal (Reverb offline/unreachable): '.$e->getMessage());
            }

            return $updatedOrder;
        });
    }

    private function nextOrderNumber(): string
    {
        $dateKey = now()->format('Ymd');
        $driver = DB::connection()->getDriverName();
        $lockKey = 'spare-part-order-'.$dateKey;

        if ($driver === 'pgsql') {
            DB::select('SELECT pg_advisory_xact_lock(?)', [crc32($lockKey)]);
        } elseif ($driver === 'mysql') {
            DB::select('SELECT GET_LOCK(?, 10)', [$lockKey]);
        }

        try {
            $sequence = Order::whereDate('created_at', now()->toDateString())->count() + 1;

            do {
                $orderNumber = 'ORD-'.$dateKey.'-'.str_pad((string) $sequence++, 4, '0', STR_PAD_LEFT);
            } while (Order::where('order_number', $orderNumber)->exists());

            return $orderNumber;
        } finally {
            if ($driver === 'mysql') {
                DB::select('SELECT RELEASE_LOCK(?)', [$lockKey]);
            }
        }
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
                    'type' => InventoryLogType::StockReturn,
                    'quantity' => $item->quantity,
                    'reference_type' => \App\Models\Order::class,
                    'reference_id' => $order->id,
                ],
                auth()->id(),
                'Stok dikembalikan — order '.$order->order_number.' dibatalkan'
            );
        }
    }

    private function setting(string $group, string $key, mixed $default): mixed
    {
        return Setting::where('group', $group)->where('key', $key)->value('value') ?? $default;
    }
}
