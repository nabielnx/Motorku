<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Services\DashboardService;
use Illuminate\Http\JsonResponse;
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

    public function index(\Illuminate\Http\Request $request): Response
    {
        $period = $request->query('period', '7_days');
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');

        $stats = $this->dashboardService->getDashboardStats($period, $startDate, $endDate);

        return Inertia::render('Dashboard/Owner/Index', [
            'stats' => $stats,
            'filters' => [
                'period' => $period,
                'start_date' => $startDate,
                'end_date' => $endDate,
            ]
        ]);
    }

    public function stats(\Illuminate\Http\Request $request): JsonResponse
    {
        $period = $request->query('period', '7_days');
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');

        $stats = $this->dashboardService->getDashboardStats($period, $startDate, $endDate);
        return response()->json($stats);
    }

    public function recentOrders(\Illuminate\Http\Request $request): JsonResponse
    {
        $perPage = $request->integer('per_page', 5);
        $period = $request->query('period');
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');

        $query = \App\Models\Order::with(['items']);

        if ($period) {
            $today = \Carbon\Carbon::today();
            if ($period === 'today') {
                $query->whereBetween('created_at', [$today->copy(), $today->copy()->endOfDay()]);
            } elseif ($period === '30_days') {
                $query->whereBetween('created_at', [$today->copy()->subDays(29), $today->copy()->endOfDay()]);
            } elseif ($period === 'this_month') {
                $query->whereBetween('created_at', [$today->copy()->startOfMonth(), $today->copy()->endOfDay()]);
            } elseif ($period === 'this_year') {
                $query->whereBetween('created_at', [$today->copy()->startOfYear(), $today->copy()->endOfDay()]);
            } elseif ($period === 'custom' && $startDate && $endDate) {
                $query->whereBetween('created_at', [\Carbon\Carbon::parse($startDate)->startOfDay(), \Carbon\Carbon::parse($endDate)->endOfDay()]);
            } elseif ($period === '7_days') {
                $query->whereBetween('created_at', [$today->copy()->subDays(6), $today->copy()->endOfDay()]);
            }
        }

        $orders = $query->latest()->paginate($perPage);
        return response()->json($orders);
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