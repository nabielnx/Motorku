<?php

namespace App\Services;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Setting;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class DashboardService
{
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

        $revenue = Order::paidWithinRange($startDate, $endDate)->sum('total');

        $ordersCount = Order::whereBetween('created_at', [$startDate, $endDate])
            ->where('order_status', '!=', 'cancelled')
            ->count();
            
        // Pending/antrean orders yang membutuhkan tindakan aktif (live, tidak terpotong rentang tanggal)
        $pendingOrders = Order::whereIn('order_status', ['pending', 'preparing', 'ready'])->count();
        $totalProducts = Product::count();

        $recentOrders = Order::with('cashier')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->latest()
            ->paginate(5);

        $topSelling = OrderItem::select('order_items.product_id', DB::raw('SUM(order_items.quantity) as total_qty'))
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->whereBetween('orders.created_at', [$startDate, $endDate])
            ->where('orders.order_status', '!=', 'cancelled')
            ->groupBy('order_items.product_id')
            ->orderByDesc('total_qty')
            ->take(5)
            ->with('product')
            ->get()
            ->map(function ($item, $index) {
                return [
                    'rank' => $index + 1,
                    'name' => $item->product ? $item->product->name : 'Produk',
                    'count' => (int) $item->total_qty
                ];
            });

        $lowStockThreshold = (int) (Setting::where('group', 'inventory')
            ->where('key', 'low_stock_threshold')
            ->value('value') ?? 10);

        $lowStock = Product::where('stock', '<=', $lowStockThreshold)
            ->orderBy('stock', 'asc')
            ->get()
            ->map(function ($p) {
                return [
                    'name' => $p->name,
                    'left' => $p->stock . ' ' . ($p->unit ?? 'pcs') . ' tersisa',
                    'status' => $p->stock <= 0 ? 'Critical' : 'Low',
                    'badgeColor' => $p->stock <= 0 ? 'bg-red-100 text-red-700 border-red-200' : 'bg-amber-100 text-amber-700 border-amber-200'
                ];
            });

        $salesData = collect();

        if ($period === 'today') {
            for ($i = 0; $i < 24; $i++) {
                $start = $startDate->copy()->addHours($i);
                $end = $start->copy()->endOfHour();
                $total = Order::paidWithinRange($start, $end)->sum('total');
                $count = Order::paidWithinRange($start, $end)->count();
                
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
                $monthEnd = $startMonth->copy()->endOfMonth();
                $total = Order::paidWithinRange($monthStart, $monthEnd)->sum('total');
                $count = Order::paidWithinRange($monthStart, $monthEnd)->count();
                
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
                $dayEnd = $startDay->copy()->endOfDay();
                $total = Order::paidWithinRange($dayStart, $dayEnd)->sum('total');
                $count = Order::paidWithinRange($dayStart, $dayEnd)->count();
                
                $salesData->push([
                    'day' => $dayStart->translatedFormat('d M'),
                    'value' => (float) $total,
                    'count' => (int) $count,
                ]);
                $startDay->addDay();
            }
        }

        $totalCustomers = Order::whereBetween('created_at', [$startDate, $endDate])
            ->whereNotNull('customer_name')
            ->where('customer_name', '!=', '')
            ->distinct('customer_name')
            ->count('customer_name');

        if ($totalCustomers === 0 && $ordersCount > 0) {
            $totalCustomers = $ordersCount;
        }

        return [
            'period' => $period,
            'revenue_today' => (float) $revenue,
            'orders_today' => (int) $ordersCount,
            'total_customers' => (int) $totalCustomers,
            'pending_orders' => (int) $pendingOrders,
            'total_products' => (int) $totalProducts,
            'recent_orders' => $recentOrders,
            'top_selling' => $topSelling,
            'low_stock' => $lowStock,
            'sales_data' => $salesData->values()->toArray(),
        ];
    }
}
