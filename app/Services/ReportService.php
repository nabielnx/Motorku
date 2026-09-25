<?php

namespace App\Services;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderReturn;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class ReportService
{
    public function netRevenue(Carbon $start, Carbon $end): float
    {
        return (float) Order::paidWithinRange($start, $end)->sum('total')
            - (float) OrderReturn::whereBetween('created_at', [$start, $end])->sum('amount');
    }

    public function getDailySummary($date = null): array
    {
        $targetDate = $date ? Carbon::parse($date) : Carbon::today();

        $orders = Order::paidWithinRange($targetDate->copy()->startOfDay(), $targetDate->copy()->endOfDay())->get();

        return [
            'date' => $targetDate->format('Y-m-d'),
            'total_revenue' => $this->netRevenue($targetDate->copy()->startOfDay(), $targetDate->copy()->endOfDay()),
            'total_tax' => (float) $orders->sum('tax_amount'),
            'total_orders' => $orders->count(),
        ];
    }

    public function getReportStats(Carbon $startDate = null, Carbon $endDate = null): array
    {
        $start = $startDate ?? Carbon::now()->startOfMonth();
        $end = $endDate ?? Carbon::now()->endOfDay();

        $daysInRange = max($start->diffInDays($end) + 1, 1);

        // Revenue from orders within the selected date range
        $orders = Order::paidWithinRange($start, $end);
        $totalRevenue = $this->netRevenue($start, $end);
        $totalRefunds = (float) OrderReturn::whereBetween('created_at', [$start, $end])->sum('amount');
        $totalSubtotal = (float) $orders->sum('subtotal');
        $totalTax = (float) $orders->sum('tax_amount');
        $totalOrders = (int) $orders->count();
        $avgOrderValue = $totalOrders > 0 ? round($totalRevenue / $totalOrders) : 0;

        // Top selling products within the date range
        $topSelling = OrderItem::select('product_id', DB::raw('SUM(quantity) as total_qty'), DB::raw('SUM(subtotal) as total_revenue'))
            ->whereHas('order', fn ($query) => $query->paidWithinRange($start, $end))
            ->groupBy('product_id')
            ->orderByDesc('total_qty')
            ->take(5)
            ->with('product.category')
            ->get();

        // Category breakdown within the date range
        $categoryRaw = OrderItem::select(
                DB::raw('COALESCE(categories.name, \'Lainnya\') as category_name'),
                DB::raw('SUM(order_items.subtotal) as total_revenue')
            )
            ->leftJoin('products', 'order_items.product_id', '=', 'products.id')
            ->leftJoin('categories', 'products.category_id', '=', 'categories.id')
            ->whereHas('order', fn ($q) => $q->paidWithinRange($start, $end))
            ->groupBy('categories.name')
            ->orderByDesc('total_revenue')
            ->get();

        $catTotal = $categoryRaw->sum('total_revenue') ?: 1;

        $categoryBreakdown = $categoryRaw->map(fn ($item) => [
            'category_name' => $item->category_name,
            'percentage' => round(($item->total_revenue / $catTotal) * 100, 1),
            'total_revenue' => (float) $item->total_revenue,
        ]);

        return [
            'total_revenue' => $totalRevenue,
            'total_refunds' => $totalRefunds,
            'total_subtotal' => $totalSubtotal,
            'total_tax' => $totalTax,
            'total_orders' => $totalOrders,
            'avg_order_value' => (float) $avgOrderValue,
            'days_in_range' => $daysInRange,
            'avg_orders_per_day' => $totalOrders > 0 ? round($totalOrders / $daysInRange, 1) : 0,
            'top_selling' => $topSelling,
            'category_breakdown' => $categoryBreakdown,
            'period_start' => $start->format('Y-m-d'),
            'period_end' => $end->format('Y-m-d'),
        ];
    }

    public function getSummaryByDateRange(Carbon $startDate, Carbon $endDate): array
    {
        $revenue = $this->netRevenue($startDate, $endDate);

        $orders = Order::paidWithinRange($startDate, $endDate)->count();

        return [
            'revenue' => (float) $revenue,
            'orders' => $orders,
            'startDate' => $startDate->toIso8601String(),
            'endDate' => $endDate->toIso8601String(),
        ];
    }

    public function getSalesByDateRange(Carbon $startDate, Carbon $endDate)
    {
        return OrderItem::select('product_id', DB::raw('SUM(quantity) as total_qty'), DB::raw('SUM(subtotal) as total_revenue'))
            ->whereHas('order', fn ($query) => $query->paidWithinRange($startDate, $endDate))
            ->groupBy('product_id')
            ->orderByDesc('total_qty')
            ->with('product')
            ->get();
    }

    public function getExportDataByDateRange(Carbon $startDate, Carbon $endDate)
    {
        return Order::with('items')
            ->paidWithinRange($startDate, $endDate)
            ->get();
    }
}
