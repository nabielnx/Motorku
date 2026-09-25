<?php

return [
    'enabled' => env('DOKU_ENABLED', false),
    'client_id' => env('DOKU_CLIENT_ID'),
    'shared_key' => env('DOKU_SHARED_KEY'),
    'base_url' => env('DOKU_BASE_URL', 'https://api-sandbox.doku.com'),
    'merchant_name' => env('DOKU_MERCHANT_NAME', 'Motorku'),
];
