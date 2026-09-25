<?php

declare(strict_types=1);

namespace App\Http\Controllers\Order;

use App\Http\Controllers\Controller;
use App\Services\OrderService;
use App\Services\OrderReturnService;
use App\Services\ReportService;
use App\Http\Requests\Order\StoreOrderRequest;
use App\Http\Requests\Order\StorePosSaleRequest;
use App\Http\Requests\Order\StoreOrderReturnRequest;
use App\Http\Requests\Order\UpdateOrderRequest;
use App\Http\Resources\OrderResource;
use App\Traits\ApiResponseHelpers;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Support\Facades\Gate;
use App\Models\Order;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class OrderController extends Controller implements HasMiddleware
{
    use ApiResponseHelpers;

    public function __construct(
        protected OrderService $orderService,
        protected ReportService $reportService
    ) {}

    public static function middleware(): array
    {
        return [
            new Middleware('role:owner|cashier'),
        ];
    }

    public function indexWeb(Request $request): InertiaResponse
    {
        $activeCount = $this->orderService->countActiveOrders();
        $search = $request->string('search')->value();
        $status = match ($request->string('status')->value()) {
            'action', 'pending', 'preparing', 'processing', 'ready' => 'action',
            'All', 'completed', 'cancelled' => 'All',
            default => $activeCount > 0 && $search === '' ? 'action' : 'All',
        };
        $date = $status === 'action' ? '' : $request->string('date')->value();

        $orders = $this->orderService->getOrdersForWeb($status, $search, $date);

        $today = now()->toDateString();

        return Inertia::render('Order/Index', [
            'initialOrders' => fn () => $orders,
            'filters' => ['status' => $status, 'search' => $search, 'date' => $date],
            'summary' => fn () => [
                'today_order_count' => Order::whereDate('created_at', $today)->count(),
                'today_order_value' => $this->reportService->netRevenue(now()->startOfDay(), now()->endOfDay()),
                'active_count' => $activeCount,
                'pending_count' => Order::where('order_status', 'pending')->count(),
                'processing_count' => Order::whereIn('order_status', ['preparing', 'processing'])->count(),
            ],
        ]);
    }

    public function showWeb(string $orderId): InertiaResponse
    {
        return Inertia::render('Order/Show', [
            'orderId' => $orderId,
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        Gate::authorize('viewAny', Order::class);

        $perPage = $request->integer('per_page', 15);
        $status = $request->query('status');
        $search = $request->query('search');

        $orders = $this->orderService->getAllOrders($perPage, $status, $search);

        // Return pagination as resource collection
        return OrderResource::collection($orders)->response();
    }

    public function pendingCount(): JsonResponse
    {
        $count = Order::where('order_status', 'pending')->count();
        return $this->successResponse('Berhasil mengambil jumlah pesanan tertunda', ['count' => $count]);
    }

    public function activeCount(): JsonResponse
    {
        return $this->successResponse('Berhasil mengambil jumlah pesanan aktif', [
            'count' => $this->orderService->countActiveOrders(),
        ]);
    }

    public function store(StoreOrderRequest $request): JsonResponse
    {
        Gate::authorize('create', Order::class);

        $order = $this->orderService->createOrder($request->validated());

        return $this->successResponse(
            'Pesanan berhasil dibuat!',
            new OrderResource($order),
            201
        );
    }

    public function storePosSale(StorePosSaleRequest $request): JsonResponse
    {
        Gate::authorize('create', Order::class);

        $sale = $this->orderService->createPosSale($request->validated());

        return $this->successResponse('Transaksi berhasil!', [
            'order' => new OrderResource($sale['order']),
            'payment' => $sale['payment'],
        ], 201);
    }

    public function storeReturn(StoreOrderReturnRequest $request, string $id, OrderReturnService $returns): JsonResponse
    {
        $order = $returns->returnItem($id, $request->validated());

        return $this->successResponse('Retur berhasil dicatat.', new OrderResource($order), 201);
    }

    public function show($id): JsonResponse
    {
        $order = $this->orderService->getOrderById($id);

        if (!$order) {
            return $this->errorResponse('Pesanan tidak ditemukan', 404);
        }

        Gate::authorize('view', $order);

        return $this->successResponse('Detail pesanan', new OrderResource($order));
    }

    public function update(UpdateOrderRequest $request, $id): JsonResponse
    {
        $order = $this->orderService->getOrderById($id);

        if (!$order) {
            return $this->errorResponse('Pesanan tidak ditemukan', 404);
        }

        Gate::authorize('update', $order);

        $updatedOrder = $this->orderService->updateOrderStatus($id, $request->validated());

        return $this->successResponse(
            'Status pesanan berhasil diperbarui!',
            new OrderResource($updatedOrder)
        );
    }

    public function updateStatus(UpdateOrderRequest $request, $id): JsonResponse
    {
        return $this->update($request, $id);
    }

    public function destroy($id): JsonResponse
    {
        $order = $this->orderService->getOrderById($id);

        if (!$order) {
            return $this->errorResponse('Pesanan tidak ditemukan', 404);
        }

        Gate::authorize('delete', $order);

        $this->orderService->deleteOrder($id);

        return $this->successResponse('Pesanan berhasil dihapus!');
    }
}
