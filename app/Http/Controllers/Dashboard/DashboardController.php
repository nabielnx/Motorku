<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\DashboardService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('role:owner'),
        ];
    }

    protected DashboardService $dashboardService;

    public function __construct(DashboardService $dashboardService)
    {
        $this->dashboardService = $dashboardService;
    }

    public function index(Request $request): Response
    {
        $this->validateFilters($request);
        $period = $request->query('period', 'today');
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');

        $stats = $this->dashboardService->getDashboardStats($period, $startDate, $endDate);

        return Inertia::render('Dashboard/Owner/Index', [
            'stats' => $stats,
            'filters' => [
                'period' => $period,
                'start_date' => $startDate,
                'end_date' => $endDate,
            ],
        ]);
    }

    public function stats(Request $request): JsonResponse
    {
        $this->validateFilters($request);
        $period = $request->query('period', 'today');
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');

        $stats = $this->dashboardService->getDashboardStats($period, $startDate, $endDate);

        return response()->json($stats);
    }

    public function recentOrders(Request $request): JsonResponse
    {
        $perPage = $request->integer('per_page', 7);
        $period = $request->query('period');
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');

        $query = Order::with(['items']);

        if ($period) {
            $today = Carbon::today();
            if ($period === 'today') {
                $query->whereBetween('created_at', [$today->copy(), $today->copy()->endOfDay()]);
            } elseif ($period === '30_days') {
                $query->whereBetween('created_at', [$today->copy()->subDays(29), $today->copy()->endOfDay()]);
            } elseif ($period === 'this_month') {
                $query->whereBetween('created_at', [$today->copy()->startOfMonth(), $today->copy()->endOfDay()]);
            } elseif ($period === 'this_year') {
                $query->whereBetween('created_at', [$today->copy()->startOfYear(), $today->copy()->endOfDay()]);
            } elseif ($period === 'custom' && $startDate && $endDate) {
                $query->whereBetween('created_at', [Carbon::parse($startDate)->startOfDay(), Carbon::parse($endDate)->endOfDay()]);
            } elseif ($period === '7_days') {
                $query->whereBetween('created_at', [$today->copy()->subDays(6), $today->copy()->endOfDay()]);
            }
        }

        $orders = $query->latest()->paginate($perPage);

        return response()->json($orders);
    }

    private function validateFilters(Request $request): void
    {
        $request->validate([
            'period' => ['sometimes', 'in:today,7_days,30_days,this_month,this_year,custom'],
            'start_date' => ['nullable', 'date_format:Y-m-d'],
            'end_date' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:start_date'],
        ]);
    }

    public function revenue(): JsonResponse
    {
        $stats = $this->dashboardService->getDashboardStats();

        return response()->json([
            'daily' => $stats['revenue_today'] ?? 0,
            'weekly' => $stats['sales_data'] ?? [],
        ]);
    }
}
