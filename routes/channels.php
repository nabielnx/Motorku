<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (string) $user->id === (string) $id;
});

Broadcast::channel('orders.{id}', function ($user, $id) {
    return $user && ($user->can('order.view') || $user->hasAnyRole(['owner', 'cashier']));
});
