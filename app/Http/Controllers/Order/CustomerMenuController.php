<?php

declare(strict_types=1);

namespace App\Http\Controllers\Order;

use App\Http\Controllers\Controller;
use App\Http\Requests\Order\StoreCustomerOrderRequest;
use App\Http\Requests\Payment\CustomerQrisRequest;
use App\Http\Requests\Payment\ReportCustomerPaymentRequest;
use App\Models\Category;
use App\Models\Order;
use App\Models\Product;
use App\Models\Setting;
use App\Services\BusinessContext;
use App\Services\CacheService;
use App\Services\CustomerOrderService;
use App\Services\OrderCancellationService;
use App\Services\OrderService;
use App\Services\QrisService;
use App\Services\SettingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
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
        return Cache::remember(CacheService::key(CacheService::SETTINGS_STORE), CacheService::TTL_SETTINGS, function () {
            $settings = app(SettingService::class)->publicValues();

            $promoBanners = collect(range(1, 3))->mapWithKeys(function (int $slot) use ($settings) {
                $path = $settings['store.promo_banner_'.$slot] ?? null;

                return [$slot => $path && ($settings['promo_banner.enabled'] ?? 'true') !== 'false' ? Storage::url($path) : null];
            })->all();

            return compact('settings', 'promoBanners');
        });
    }

    public function index(): Response
    {
        $settingsData = $this->settingsAndBanners();
        if (($settingsData['settings']['qr_order.enabled'] ?? 'true') === 'false') {
            return Inertia::render('Order/Menu', ['initialProducts' => [], 'initialCategories' => [], 'settings' => $settingsData['settings'], 'bestSellerProductIds' => [], 'promoBanners' => []]);
        }
        // Single query for both totalSoldMap AND bestSellerProductIds (was 2 separate queries)
        $salesData = app(BusinessContext::class)->table('order_items')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->where('orders.order_status', '!=', 'cancelled')
            ->whereExists(function ($query) {
                $query->selectRaw('1')
                    ->from('payments')
                    ->whereColumn('payments.order_id', 'orders.id')
                    ->where('payments.status', 'paid');
            })
            ->select('order_items.product_id', DB::raw('SUM(order_items.quantity) as total_sold'))
            ->groupBy('order_items.product_id')
            ->orderByDesc('total_sold')
            ->get();

        $totalSoldMap = $salesData->pluck('total_sold', 'product_id')->toArray();
        $bestSellerProductIds = $salesData->take(5)->pluck('product_id')->toArray();

        $recommendedProductIds = app(BusinessContext::class)->table('motorcycle_parts')
            ->where('is_recommended', true)
            ->pluck('product_id')
            ->unique()
            ->flip()
            ->toArray();

        $products = Product::query()
            ->select(['id', 'category_id', 'sku', 'barcode', 'brand', 'unit', 'name', 'description', 'price', 'stock', 'image_path', 'is_available'])
            ->with(['category:id,name,parent_id', 'category.parent:id,name', 'motorcycles:id,brand,model,engine_type,year_start,year_end'])
            ->where('is_available', true)
            ->get()
            ->map(function ($product) use ($totalSoldMap, $recommendedProductIds) {
                $product->motorcycles->each->makeHidden('pivot');
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
        abort_if(Setting::where('group', 'qr_order')->where('key', 'enabled')->value('value') === 'false', 403, 'Pemesanan online sedang dinonaktifkan. Silakan hubungi kasir.');
        $data = $request->validated();
        if (collect($data['items'])->sum('quantity') > config('order.public_max_total_quantity', 30)) {
            throw ValidationException::withMessages([
                'items' => 'Total barang melebihi batas pesanan online.',
            ]);
        }
        $data['payment_status'] = 'unpaid';
        // Only the CSRF-protected browser checkout can associate an authenticated
        // customer. The legacy stateless API continues to create guest orders.
        $customer = $request->routeIs('customer.checkout') ? Auth::guard('customer')->user() : null;
        if ($customer) {
            $data['customer_account_id'] = $customer->id;
        }

        $order = DB::transaction(function () use ($data, $orderService) {
            // QR orders stay customer-owned even when the same browser is
            // also logged in to the cashier panel.
            $order = $orderService->createOrder($data, true);

            return $order;
        });

        return response()->json([
            'message' => 'Pesanan berhasil diterima. Silakan ambil di toko!',
            'data' => array_merge(app(CustomerOrderService::class)->snapshot($order), [
                'customer_token' => $order->getAttribute('customer_access_token'),
                'pickup' => true, // Semua order toko sparepart = ambil di toko
            ]),
        ], 201)->header('Cache-Control', 'no-store, private');
    }

    public function customerQris(CustomerQrisRequest $request, string $orderId, QrisService $qris): JsonResponse
    {
        return response()->json(['data' => $qris->forCustomerOrder($orderId, $request->validated('customer_token'))])
            ->header('Cache-Control', 'no-store, private');
    }

    /**
     * Public endpoint for customer to check order status (polling).
     */
    public function orderStatus(Request $request, string $orderId, CustomerOrderService $customers): JsonResponse
    {
        // Legacy query tokens remain readable for existing receipts. New clients use a header.
        $token = $request->header('X-Customer-Token') ?? $request->query('customer_token');
        abort_unless($token, 401, 'Akses ditolak. Token tidak ditemukan.');
        abort_unless(is_string($token) && strlen($token) === 64, 401, 'Pesanan atau token tidak valid.');
        $order = $customers->authorizedOrder($orderId, $token);

        return response()->json(['data' => $customers->snapshot($order)])->header('Cache-Control', 'no-store, private');
    }

    public function reportPayment(ReportCustomerPaymentRequest $request, string $orderId, CustomerOrderService $customers): JsonResponse
    {
        $order = $customers->reportPayment($orderId, $request->validated('customer_token'), $request->validated('reference'));

        return response()->json(['data' => $customers->snapshot($order)])->header('Cache-Control', 'no-store, private');
    }

    /**
     * Public endpoint for customer to cancel an unpaid pending order.
     */
    public function cancelOrder(Request $request, string $orderId, OrderCancellationService $cancellation): JsonResponse
    {
        $token = $request->validate([
            'customer_token' => ['required', 'string', 'size:64'],
        ])['customer_token'];

        if (! Str::isUuid($orderId)) {
            return response()->json(['message' => 'ID pesanan tidak valid.'], 400);
        }

        $result = $cancellation->cancelForCustomer($orderId, $token);
        $failure = match ($result['outcome']) {
            'invalid_token' => ['Token tidak valid.', 401],
            'already_cancelled' => ['Pesanan sudah dibatalkan sebelumnya.', 400],
            'under_review' => ['Pembayaran sedang diperiksa kasir. Hubungi toko untuk bantuan.', 422],
            'not_pending' => ['Pesanan yang sudah dibayar atau sedang disiapkan tidak dapat dibatalkan.', 422],
            default => null,
        };
        if ($failure) {
            return response()->json(['message' => $failure[0]], $failure[1]);
        }

        return response()->json([
            'message' => 'Pesanan berhasil dibatalkan.',
            'data' => app(CustomerOrderService::class)->snapshot($result['order']),
        ]);
    }
}
