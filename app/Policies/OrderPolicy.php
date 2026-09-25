<?php

namespace App\Policies;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Models\Order;
use App\Models\User;

class OrderPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('order.view') || $user->hasAnyRole(['owner', 'cashier']);
    }

    public function view(User $user, Order $order): bool
    {
        return $user->can('order.view') || $user->hasAnyRole(['owner', 'cashier']);
    }

    public function create(User $user): bool
    {
        return $user->can('order.create') || $user->hasAnyRole(['owner', 'cashier']);
    }

    public function update(User $user, Order $order): bool
    {
        $status = $order->order_status;
        if ($status === OrderStatus::Completed || $status === OrderStatus::Cancelled || in_array($status, ['completed', 'cancelled'])) {
            return false;
        }

        return $user->can('order.update') || $user->hasAnyRole(['owner', 'cashier']);
    }

    public function delete(User $user, Order $order): bool
    {
        return $user->hasRole('owner')
            && $order->payment_status === PaymentStatus::Unpaid
            && in_array($order->order_status, [OrderStatus::Pending, OrderStatus::Cancelled], true);
    }
}
