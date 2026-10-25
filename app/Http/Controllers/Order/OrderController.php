<?php

declare(strict_types=1);

namespace App\Http\Controllers\Order;

use App\Http\Controllers\Controller;
use App\Http\Requests\Order\StoreOrderRequest;
use App\Http\Requests\Order\StoreOrderReturnRequest;
use App\Http\Requests\Order\StorePosSaleRequest;
use App\Http\Requests\Order\UpdateOrderRequest;
use App\Http\Requests\PaginationRequest;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Models\OrderReturn;
use App\Services\OrderReturnService;
use App\Services\OrderService;
use App\Services\ReportService;
use App\Traits\ApiResponseHelpers;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
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
        $request->validate([
            'period' => ['sometimes', Rule::in(['all', 'today', '7_days', '30_days', 'this_month', 'this_year', 'custom'])],
            'start_date' => ['nullable', 'date_format:Y-m-d'],
            'end_date' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:start_date'],
        ]);

        $activeCount = $this->orderService->countActiveOrders();
        $search = $request->string('search')->value();
        $status = match ($request->string('status')->value()) {
            'action', 'pending', 'preparing', 'processing', 'ready' => 'action',
            'All', 'completed', 'cancelled' => 'All',
            default => $activeCount > 0 && $search === '' ? 'action' : 'All',
        };
        $legacyDate = $request->string('date')->value();
        $period = $request->query('period', match ($legacyDate) {
            'today' => 'today',
            'week' => '7_days',
            default => 'all',
        });
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');
        if ($status === 'action') {
            $period = 'all';
            $startDate = null;
            $endDate = null;
        }

        $orders = $this->orderService->getOrdersForWeb($status, $search, $period, $startDate, $endDate);

        $summaryPeriod = $status === 'action' ? 'today' : $period;
        [$summaryStart, $summaryEnd] = $this->summaryDateRange($summaryPeriod, $startDate, $endDate);
        $summaryOrders = Order::query();

        if ($summaryStart && $summaryEnd) {
            $summaryOrders->whereBetween('created_at', [$summaryStart, $summaryEnd]);
            $periodOrderValue = $this->reportService->netRevenue($summaryStart, $summaryEnd);
        } else {
            $periodOrderValue = (float) Order::paid()->sum('total') - (float) OrderReturn::sum('amount');
        }

        return Inertia::render('Order/Index', [
            'initialOrders' => fn () => $orders,
            'filters' => [
                'status' => $status,
                'search' => $search,
                'period' => $period,
                'start_date' => $startDate,
                'end_date' => $endDate,
            ],
            'summary' => fn () => [
                'period_order_count' => $summaryOrders->count(),
                'period_order_value' => $periodOrderValue,
                'period' => $summaryPeriod,
                'active_count' => $activeCount,
                'pending_count' => Order::where('order_status', 'pending')->count(),
                'processing_count' => Order::whereIn('order_status', ['preparing', 'processing'])->count(),
            ],
        ]);
    }

    /** @return array{Carbon, Carbon}|array{null, null} */
    private function summaryDateRange(string $period, ?string $startDate, ?string $endDate): array
    {
        $today = Carbon::today();

        return match ($period) {
            'today' => [$today->copy()->startOfDay(), $today->copy()->endOfDay()],
            '7_days' => [$today->copy()->subDays(6)->startOfDay(), $today->copy()->endOfDay()],
            '30_days' => [$today->copy()->subDays(29)->startOfDay(), $today->copy()->endOfDay()],
            'this_month' => [$today->copy()->startOfMonth(), $today->copy()->endOfDay()],
            'this_year' => [$today->copy()->startOfYear(), $today->copy()->endOfDay()],
            'custom' => [
                $startDate ? Carbon::parse($startDate)->startOfDay() : $today->copy()->subDays(6)->startOfDay(),
                $endDate ? Carbon::parse($endDate)->endOfDay() : $today->copy()->endOfDay(),
            ],
            default => [null, null],
        };
    }

    public function showWeb(string $orderId): InertiaResponse
    {
        $order = $this->orderService->getOrderById($orderId);
        abort_unless($order, 404);
        Gate::authorize('view', $order);

        return Inertia::render('Order/Show', [
            'order' => (new OrderResource($order))->resolve(),
        ]);
    }

    public function index(PaginationRequest $request): JsonResponse
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

        if (! $order) {
            return $this->errorResponse('Pesanan tidak ditemukan', 404);
        }

        Gate::authorize('view', $order);

        return $this->successResponse('Detail pesanan', new OrderResource($order));
    }

    public function update(UpdateOrderRequest $request, $id): JsonResponse
    {
        $order = $this->orderService->getOrderById($id);

        if (! $order) {
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

        if (! $order) {
            return $this->errorResponse('Pesanan tidak ditemukan', 404);
        }

        Gate::authorize('delete', $order);

        $this->orderService->deleteOrder($id);

        return $this->successResponse('Pesanan berhasil dihapus!');
    }
}
