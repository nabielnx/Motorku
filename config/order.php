<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Order Expiry (minutes)
    |--------------------------------------------------------------------------
    |
    | Jumlah menit sebelum order pending + unpaid dianggap kadaluarsa.
    | Dipakai oleh artisan command `orders:expire-stale`.
    |
    */

    'expiry_minutes' => (int) env('ORDER_EXPIRY_MINUTES', 15),
    'public_max_quantity_per_item' => (int) env('ORDER_PUBLIC_MAX_QUANTITY_PER_ITEM', 10),
    'public_max_total_quantity' => (int) env('ORDER_PUBLIC_MAX_TOTAL_QUANTITY', 30),

];
