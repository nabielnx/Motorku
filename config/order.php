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

    'expiry_minutes' => (int) env('ORDER_EXPIRY_MINUTES', 60),

];
