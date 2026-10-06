<?php

use App\Models\User;
use App\Services\OrderService;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\DB;

// Used only by CheckoutConcurrencyTest, after committed fixtures are ready.
require dirname(__DIR__, 2).'/vendor/autoload.php';
$app = require dirname(__DIR__, 2).'/bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();
if (! $app->environment('testing') || DB::connection()->getDatabaseName() !== 'sparepart_testing') {
    throw new RuntimeException('Concurrent checkout must use sparepart_testing.');
}

[$script, $directory, $worker, $actor, $payload] = $argv;
if (realpath(dirname($directory)) !== realpath(storage_path('app/testing')) || ! is_dir($directory)) {
    throw new RuntimeException('Invalid test coordination directory.');
}
auth()->setUser(User::findOrFail($actor));
file_put_contents($directory.'/'.$worker.'.ready', 'ready');
$deadline = microtime(true) + 15;
while (! is_file($directory.'/start')) {
    if (microtime(true) >= $deadline) {
        throw new RuntimeException('Checkout test start timed out.');
    }
    usleep(10000);
}
$sale = app(OrderService::class)->createPosSale(json_decode($payload, true, 512, JSON_THROW_ON_ERROR));
echo $sale['order']->id;
