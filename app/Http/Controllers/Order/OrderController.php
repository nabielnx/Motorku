<?php

namespace App\Http\Controllers\Order;

use App\Http\Controllers\Controller;
use App\Services\OrderService;
use App\Http\Requests\Order\StoreOrderRequest;
use App\Http\Requests\Order\UpdateOrderRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Support\Facades\Gate;
use App\Models\Order;

class OrderController extends Controller implements HasMiddleware
{
    protected $orderService;

    public function __construct(OrderService $orderService)
    {
        $this->orderService = $orderService;
    }

    public static function middleware(): array
    {
        return [
            new Middleware('role:owner|cashier'),
        ];
    }

    public function indexWeb(\Illuminate\Http\Request $request)
    {
        $status = $request->string('status')->value();
        $search = $request->string('search')->value();

        $query = Order::with(['items', 'cashier', 'payments'])->latest();

        if ($status && $status !== 'All') {
            $query->where('order_status', $status);
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('order_number', 'like', "%{$search}%")
                  ->orWhere('customer_name', 'like', "%{$search}%");
            });
        }

        $orders = $query->paginate(10)
            ->withQueryString()
            ->through(function ($order) {
                return [
                    'id' => $order->order_number ?: substr($order->id, 0, 8),
                    'real_id' => $order->id,
                    'customer' => $order->customer_name ?: 'Walk-in Guest',
                    'type' => 'Ambil di Toko',
                    'table' => '-',
                    'items' => $order->items ? $order->items->sum('quantity') : 0,
                    'total' => (float) $order->total,
                    'status' => $order->order_status,
                    'payment_status' => $order->payment_status,
                    'paid_at' => $order->payments
                        ->where('status', 'paid')
                        ->sortByDesc('paid_at')
                        ->first()?->paid_at?->toIso8601String(),
                    'created_at' => $order->created_at?->toIso8601String(),
                    'time' => $order->created_at ? $order->created_at->timezone('Asia/Jakarta')->format('H:i') : '-',
                    'date' => $order->created_at ? $order->created_at->timezone('Asia/Jakarta')->format('d M Y') : '-',
                ];
            });

        $today = now()->toDateString();

        return \Inertia\Inertia::render('Order/Index', [
            'initialOrders' => fn () => $orders,
            'summary' => fn () => [
                'today_order_count' => Order::whereDate('created_at', $today)->count(),
                'today_order_value' => (float) Order::whereDate('created_at', $today)
                    ->where('payment_status', 'paid')
                    ->sum('total'),
                'pending_count' => Order::where('order_status', 'pending')->count(),
                'processing_count' => Order::whereIn('order_status', ['preparing', 'processing'])->count(),
            ],
        ]);
    }

    public function showWeb(string $orderId)
    {
        return \Inertia\Inertia::render('Order/Show', [
            'orderId' => $orderId,
        ]);
    }

    public function index(\Illuminate\Http\Request $request): JsonResponse
    {
        Gate::authorize('viewAny', Order::class);

        $perPage = $request->integer('per_page', 15);
        $status = $request->query('status');
        $search = $request->query('search');

        $orders = $this->orderService->getAllOrders($perPage, $status, $search);
        return response()->json($orders);
    }

    public function pendingCount(): JsonResponse
    {
        $count = Order::where('order_status', 'pending')->count();
        return response()->json(['count' => $count]);
    }

    public function store(StoreOrderRequest $request): JsonResponse
    {
        Gate::authorize('create', Order::class);

        $order = $this->orderService->createOrder($request->validated());

        return response()->json([
            'message' => 'Pesanan berhasil dibuat!',
            'data' => $order
        ], 201);
    }

    public function show($id): JsonResponse
    {
        $order = $this->orderService->getOrderById($id);

        if (!$order) {
            return response()->json(['message' => 'Pesanan tidak ditemukan'], 404);
        }

        Gate::authorize('view', $order);

        return response()->json($order);
    }

    public function update(UpdateOrderRequest $request, $id): JsonResponse
    {
        // 1. Ambil data pesanan dulu untuk dicek Policy-nya
        $order = $this->orderService->getOrderById($id);

        if (!$order) {
            return response()->json(['message' => 'Pesanan tidak ditemukan'], 404);
        }

        // 2. Cek Policy
        Gate::authorize('update', $order);

        // 3. Eksekusi update via service seperti aslinya
        $updatedOrder = $this->orderService->updateOrderStatus($id, $request->validated());

        return response()->json([
            'message' => 'Status pesanan berhasil diperbarui!',
            'data' => $updatedOrder
        ]);
    }

    public function updateStatus(UpdateOrderRequest $request, $id): JsonResponse
    {
        return $this->update($request, $id);
    }

    public function destroy($id): JsonResponse
    {
        $order = $this->orderService->getOrderById($id);

        if (!$order) {
            return response()->json(['message' => 'Pesanan tidak ditemukan'], 404);
        }

        Gate::authorize('delete', $order);

        $this->orderService->deleteOrder($id);

        return response()->json([
            'message' => 'Pesanan berhasil dihapus!'
        ]);
    }
}
