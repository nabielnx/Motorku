<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\CustomerAccount;
use App\Models\Order;

final class CustomerHistoryService
{
    public function list(CustomerAccount $customer, string $filter = 'all'): array
    {
        $query = Order::where('customer_account_id', $customer->id);
        $statuses = (clone $query)->selectRaw('order_status, COUNT(*) as total')->groupBy('order_status')->pluck('total', 'order_status');
        $all = (int) $statuses->sum();
        $closed = (int) ($statuses['completed'] ?? 0) + (int) ($statuses['cancelled'] ?? 0);
        $page = $query
            ->when($filter === 'active', fn ($query) => $query->whereNotIn('order_status', ['completed', 'cancelled']))
            ->when($filter === 'closed', fn ($query) => $query->whereIn('order_status', ['completed', 'cancelled']))
            ->with(['items', 'payments', 'returns.item'])->latest()->orderByDesc('id')->paginate(20)
            ->through(fn (Order $order) => app(CustomerOrderService::class)->snapshot($order));

        return [...$page->toArray(), 'counts' => ['all' => $all, 'active' => $all - $closed, 'closed' => $closed]];
    }

    public function detail(CustomerAccount $customer, string $id): array
    {
        $order = Order::where('customer_account_id', $customer->id)->findOrFail($id);

        return [...app(CustomerOrderService::class)->snapshot($order), 'customer_token' => $order->customer_access_token];
    }
}
