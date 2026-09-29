<?php

namespace App\Services;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderReturn;
use App\Models\Product;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class DashboardService
{
    public function __construct(private ReportService $reportService) {}

    public function getDashboardStats(string $period = '7_days', ?string $customStart = null, ?string $customEnd = null): array
    {
        $today = Carbon::today();

        switch ($period) {
            case 'today':
                $startDate = $today->copy();
                $endDate = $today->copy()->endOfDay();
                break;
            case '30_days':
                $startDate = $today->copy()->subDays(29);
                $endDate = $today->copy()->endOfDay();
                break;
            case 'this_month':
                $startDate = $today->copy()->startOfMonth();
                $endDate = $today->copy()->endOfDay();
                break;
            case 'this_year':
                $startDate = $today->copy()->startOfYear();
                $endDate = $today->copy()->endOfDay();
                break;
            case 'custom':
                $startDate = $customStart ? Carbon::parse($customStart)->startOfDay() : $today->copy()->subDays(6)->startOfDay();
                $endDate = $customEnd ? Carbon::parse($customEnd)->endOfDay() : $today->copy()->endOfDay();
                break;
            case '7_days':
            default:
                $startDate = $today->copy()->subDays(6);
                $endDate = $today->copy()->endOfDay();
                break;
        }

        if ($endDate->lt($startDate) || $startDate->diffInDays($endDate) > 366) {
            throw ValidationException::withMessages([
                'start_date' => 'Rentang dashboard maksimal 366 hari dan tanggal akhir tidak boleh lebih awal.',
            ]);
        }

        $revenue = $this->reportService->netRevenue($startDate, $endDate);

        $ordersCount = Order::paidWithinRange($startDate, $endDate)->count();

        // Pending/antrean orders yang membutuhkan tindakan aktif (live, tidak terpotong rentang tanggal)
        $pendingOrders = Order::whereIn('order_status', ['pending', 'preparing', 'ready'])->count();
        $totalProducts = Product::count();

        $recentOrders = Order::with('cashier')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->latest()
            ->paginate(7);

        $topSelling = OrderItem::select('order_items.product_id', DB::raw('SUM(order_items.quantity) as total_qty'))
            ->whereHas('order', fn ($query) => $query->paidWithinRange($startDate, $endDate))
            ->groupBy('order_items.product_id')
            ->orderByDesc('total_qty')
            ->with('product')
            ->get()
            ->map(function ($item, $index) {
                return [
                    'rank' => $index + 1,
                    'name' => $item->product ? $item->product->name : 'Produk',
                    'count' => (int) $item->total_qty,
                ];
            });

        $lowStock = Product::whereColumn('stock', '<=', 'minimum_stock')
            ->orderBy('stock', 'asc')
            ->get()
            ->map(function ($p) {
                return [
                    'name' => $p->name,
                    'left' => $p->stock.' '.($p->unit ?? 'pcs').' tersisa',
                    'status' => $p->stock <= 0 ? 'Critical' : 'Low',
                    'badgeColor' => $p->stock <= 0 ? 'bg-red-100 text-red-700 border-red-200' : 'bg-amber-100 text-amber-700 border-amber-200',
                ];
            });

        $salesData = collect();
        $grouping = $period === 'today' ? 'hour' : ($period === 'this_year' ? 'month' : 'day');
        [$salesByPeriod, $returnsByPeriod] = $this->seriesTotals($startDate, $endDate, $grouping);

        if ($period === 'today') {
            for ($i = 0; $i < 24; $i++) {
                $start = $startDate->copy()->addHours($i);
                $key = $start->format('Y-m-d H');
                $total = (float) ($salesByPeriod[$key]->total ?? 0) - (float) ($returnsByPeriod[$key] ?? 0);
                $count = (int) ($salesByPeriod[$key]->orders_count ?? 0);

                // Only show active hours or if there's sales
                if ($total > 0 || $count > 0 || ($i >= 8 && $i <= 22)) {
                    $salesData->push([
                        'day' => sprintf('%02d:00', $i),
                        'value' => (float) $total,
                        'count' => (int) $count,
                    ]);
                }
            }
        } elseif ($period === 'this_year') {
            $startMonth = $startDate->copy();
            $endMonth = $endDate->copy();

            while ($startMonth <= $endMonth) {
                $monthStart = $startMonth->copy()->startOfMonth();
                $key = $monthStart->format('Y-m');
                $total = (float) ($salesByPeriod[$key]->total ?? 0) - (float) ($returnsByPeriod[$key] ?? 0);
                $count = (int) ($salesByPeriod[$key]->orders_count ?? 0);

                $salesData->push([
                    'day' => $monthStart->translatedFormat('M Y'),
                    'value' => (float) $total,
                    'count' => (int) $count,
                ]);
                $startMonth->addMonth();
            }
        } else {
            $startDay = $startDate->copy();
            $endDay = $endDate->copy();

            while ($startDay <= $endDay) {
                $dayStart = $startDay->copy()->startOfDay();
                $key = $dayStart->format('Y-m-d');
                $total = (float) ($salesByPeriod[$key]->total ?? 0) - (float) ($returnsByPeriod[$key] ?? 0);
                $count = (int) ($salesByPeriod[$key]->orders_count ?? 0);

                $salesData->push([
                    'day' => $dayStart->translatedFormat('d M'),
                    'value' => (float) $total,
                    'count' => (int) $count,
                    'is_today' => $dayStart->isSameDay($today),
                ]);
                $startDay->addDay();
            }
        }

        return [
            'period' => $period,
            'revenue_today' => (float) $revenue,
            'orders_today' => (int) $ordersCount,
            'pending_orders' => (int) $pendingOrders,
            'total_products' => (int) $totalProducts,
            'recent_orders' => $recentOrders,
            'top_selling' => $topSelling,
            'low_stock' => $lowStock,
            'sales_data' => $salesData->values()->toArray(),
        ];
    }

    private function seriesTotals(Carbon $start, Carbon $end, string $grouping): array
    {
        $driver = DB::connection()->getDriverName();
        $dateKey = static function (string $column) use ($driver, $grouping): string {
            if ($grouping === 'day') {
                return "DATE({$column})";
            }

            $format = $grouping === 'hour' ? '%Y-%m-%d %H' : '%Y-%m';

            if ($driver === 'pgsql') {
                $postgresFormat = $grouping === 'hour' ? 'YYYY-MM-DD HH24' : 'YYYY-MM';

                return "to_char({$column}, '{$postgresFormat}')";
            }

            return $driver === 'sqlite'
                ? "strftime('{$format}', {$column})"
                : "DATE_FORMAT({$column}, '{$format}')";
        };

        $paymentKey = $dateKey('payments.paid_at');
        $returnKey = $dateKey('order_returns.created_at');

        $sales = DB::table('orders')
            ->join('payments', 'payments.order_id', '=', 'orders.id')
            ->whereNull('orders.deleted_at')
            ->whereNull('payments.deleted_at')
            ->where('orders.order_status', '!=', 'cancelled')
            ->where('payments.status', 'paid')
            ->whereBetween('payments.paid_at', [$start, $end])
            ->selectRaw("{$paymentKey} as period_key, SUM(orders.total) as total, COUNT(DISTINCT orders.id) as orders_count")
            ->groupByRaw($paymentKey)
            ->get()
            ->keyBy('period_key');

        $returns = OrderReturn::query()
            ->whereBetween('created_at', [$start, $end])
            ->selectRaw("{$returnKey} as period_key, SUM(amount) as total")
            ->groupByRaw($returnKey)
            ->get()
            ->pluck('total', 'period_key');

        return [$sales, $returns];
    }
}
