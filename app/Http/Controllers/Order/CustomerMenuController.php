<?php

namespace App\Http\Controllers\Order;

use App\Enums\InventoryLogType;
use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Order\StoreCustomerOrderRequest;
use App\Models\Category;
use App\Models\Order;
use App\Models\Product;
use App\Models\Setting;
use App\Services\CacheService;
use App\Services\InventoryService;
use App\Services\OrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class CustomerMenuController extends Controller
{
    /**
     * Single query for all store/tax/catalog settings + promo banners.
     * Cached for 60 minutes, flushed when settings are saved.
     */
    private function settingsAndBanners(): array
    {
        return Cache::remember(CacheService::SETTINGS_STORE, CacheService::TTL_SETTINGS, function () {
            $rows = Setting::query()
                ->whereIn('group', ['store', 'tax', 'catalog'])
                ->get(['group', 'key', 'value']);

            $settings = $rows->mapWithKeys(fn ($s) => [
                $s->group.'.'.$s->key => $s->value,
            ])->toArray();

            $promoBanners = collect(range(1, 3))->mapWithKeys(function (int $slot) use ($settings) {
                $path = $settings['store.promo_banner_'.$slot] ?? null;

                return [$slot => $path ? Storage::url($path) : null];
            })->all();

            return compact('settings', 'promoBanners');
        });
    }

    public function index(): Response
    {
        // Single query for both totalSoldMap AND bestSellerProductIds (was 2 separate queries)
        $salesData = DB::table('order_items')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->where('orders.order_status', '!=', 'cancelled')
            ->select('order_items.product_id', DB::raw('SUM(order_items.quantity) as total_sold'))
            ->groupBy('order_items.product_id')
            ->orderByDesc('total_sold')
            ->get();

        $totalSoldMap = $salesData->pluck('total_sold', 'product_id')->toArray();
        $bestSellerProductIds = $salesData->take(5)->pluck('product_id')->toArray();

        $recommendedProductIds = DB::table('motorcycle_parts')
            ->where('is_recommended', true)
            ->whereNull('deleted_at')
            ->pluck('product_id')
            ->unique()
            ->flip()
            ->toArray();

        $products = Product::query()
            ->select(['id', 'category_id', 'sku', 'name', 'description', 'price', 'stock', 'image_path', 'is_available'])
            ->with(['category:id,name', 'motorcycles:id,brand,model,year_start,year_end'])
            ->where('is_available', true)
            ->get()
            ->map(function ($product) use ($totalSoldMap, $recommendedProductIds) {
                $product->total_sold = (int) ($totalSoldMap[$product->id] ?? 0);
                $product->is_recommended = isset($recommendedProductIds[$product->id]);

                return $product;
            });

        $categories = Category::with('children:id,name,parent_id')
            ->whereNull('parent_id')
            ->select(['id', 'name'])
            ->get();

        $settingsData = $this->settingsAndBanners();

        return Inertia::render('Order/Menu', [
            'initialProducts' => $products,
            'initialCategories' => $categories,
            'settings' => $settingsData['settings'],
            'bestSellerProductIds' => $bestSellerProductIds,
            'promoBanners' => $settingsData['promoBanners'],
        ]);
    }

    /**
     * Public endpoint for customer QR self-order (no auth required).
     */
    public function storeOrder(StoreCustomerOrderRequest $request, OrderService $orderService): JsonResponse
    {
        $data = $request->validated();
        $data['payment_status'] = 'unpaid';

        $order = DB::transaction(function () use ($data, $orderService) {
            // QR orders stay customer-owned even when the same browser is
            // also logged in to the cashier panel.
            return $orderService->createOrder($data, true);
        });

        return response()->json([
            'message' => 'Pesanan berhasil diterima. Silakan ambil di toko!',
            'data' => array_merge($order->toArray(), [
                'customer_token' => $order->getAttribute('customer_access_token'),
                'pickup' => true, // Semua order toko sparepart = ambil di toko
            ]),
        ], 201);
    }

    /**
     * Public endpoint for customer to check order status (polling).
     */
    public function orderStatus(Request $request, string $orderId): JsonResponse
    {
        $token = $request->validate(['customer_token' => ['nullable', 'string', 'size:64']])['customer_token'] ?? null;

        if (! $token) {
            return response()->json(['message' => 'Akses ditolak. Token tidak ditemukan.'], 401);
        }

        $order = Order::with(['items'])->whereKey($orderId)->first();

        if (! $order || $order->customer_access_token !== $token) {
            return response()->json(['message' => 'Token tidak valid.'], 401);
        }

        return response()->json([
            'data' => [
                'id' => $order->id,
                'order_number' => $order->order_number,
                'order_status' => $order->order_status,
                'payment_status' => $order->payment_status,
                'customer_name' => $order->customer_name,
                'table_name' => 'Ambil di Toko',
                'subtotal' => (float) $order->subtotal,
                'discount_amount' => (float) $order->discount_amount,
                'tax_amount' => (float) $order->tax_amount,
                'total' => (float) $order->total,
                'ordered_at' => $order->created_at?->format('d M Y, H:i'),
                'items' => $order->items->map(fn ($item) => [
                    'id' => $item->id,
                    'product_name' => $item->product_name ?? $item->product?->name ?? 'Produk',
                    'unit_price' => (float) $item->unit_price,
                    'quantity' => (int) $item->quantity,
                    'subtotal' => (float) $item->subtotal,
                    'notes' => $item->notes,
                ]),
            ],
        ])->header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    }

    /**
     * Public endpoint for customer to cancel an unpaid pending order.
     */
    public function cancelOrder(Request $request, string $orderId): JsonResponse
    {
        $token = $request->validate([
            'customer_token' => ['required', 'string', 'size:64'],
        ])['customer_token'];

        if (! Str::isUuid($orderId)) {
            return response()->json(['message' => 'ID pesanan tidak valid.'], 400);
        }

        return DB::transaction(function () use ($orderId, $token) {
            $order = Order::whereKey($orderId)->lockForUpdate()->first();

            if (! $order || $order->customer_access_token !== $token) {
                return response()->json(['message' => 'Token tidak valid.'], 401);
            }

            if ($order->order_status === OrderStatus::Cancelled) {
                return response()->json(['message' => 'Pesanan sudah dibatalkan sebelumnya.'], 400);
            }

            if ($order->payment_status === PaymentStatus::Paid || $order->order_status !== OrderStatus::Pending) {
                return response()->json([
                    'message' => 'Pesanan yang sudah dibayar atau sedang disiapkan tidak dapat dibatalkan.',
                ], 422);
            }

            $order->update([
                'order_status' => OrderStatus::Cancelled,
                'sync_version' => $order->sync_version + 1,
            ]);

            // Cancel any pending payments for this order
            $order->payments()->where('status', 'pending')->update(['status' => 'cancelled']);

            // Restore reserved stock via InventoryService
            $inventoryService = app(InventoryService::class);
            foreach ($order->items as $item) {
                $inventoryService->adjustStock(
                    [
                        'product_id' => $item->product_id,
                        'type' => InventoryLogType::StockReturn,
                        'quantity' => $item->quantity,
                        'reference_type' => \App\Models\Order::class,
                        'reference_id' => $order->id,
                    ],
                    null,
                    'Stok dikembalikan — order '.$order->order_number.' dibatalkan oleh customer'
                );
            }

            return response()->json([
                'message' => 'Pesanan berhasil dibatalkan.',
                'data' => [
                    'id' => $order->id,
                    'order_status' => OrderStatus::Cancelled->value,
                ],
            ]);
        });
    }
}
