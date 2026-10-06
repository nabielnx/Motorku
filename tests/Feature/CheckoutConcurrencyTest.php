<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\DatabaseTruncation;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Symfony\Component\Process\Process;
use Tests\TestCase;

class CheckoutConcurrencyTest extends TestCase
{
    // Workers need committed fixtures, rather than RefreshDatabase's transaction.
    use DatabaseTruncation;

    protected function tearDown(): void
    {
        // This schema includes irreversible hard-delete migrations; do not roll it back.
        $this->truncateTablesForAllConnections();
        parent::tearDown();
    }

    public function test_two_processes_create_one_paid_sale_and_deduct_stock_once(): void
    {
        $this->assertSame('sparepart_testing', DB::connection()->getDatabaseName());
        $this->seed(RoleSeeder::class);
        $owner = User::factory()->create();
        $owner->assignRole('owner');
        $product = Product::factory()->create(['price' => 10000, 'stock' => 5]);
        $payload = json_encode([
            'request_id' => (string) Str::uuid(), 'customer_name' => 'Concurrent sale',
            'items' => [['product_id' => $product->id, 'quantity' => 1]], 'amount_received' => 10000,
        ], JSON_THROW_ON_ERROR);
        $directory = storage_path('app/testing/'.Str::uuid());
        mkdir($directory, 0700, true);
        $connection = DB::connection()->getConfig();
        $env = [
            'APP_ENV' => 'testing', 'APP_CONFIG_CACHE' => $directory.'/unused-config.php',
            'DB_CONNECTION' => 'mysql', 'DB_URL' => '', 'DB_DATABASE' => 'sparepart_testing',
            'DB_HOST' => $connection['host'], 'DB_PORT' => (string) $connection['port'],
            'DB_USERNAME' => $connection['username'], 'DB_PASSWORD' => $connection['password'],
            'CACHE_STORE' => 'array', 'SESSION_DRIVER' => 'array', 'QUEUE_CONNECTION' => 'sync',
        ];
        $workers = [];
        try {
            foreach (['first', 'second'] as $name) {
                $worker = new Process([PHP_BINARY, base_path('tests/fixtures/checkout-worker.php'), $directory, $name, $owner->id, $payload], base_path(), $env, null, 20);
                $worker->start();
                $workers[] = $worker;
            }
            $deadline = microtime(true) + 15;
            while (! is_file($directory.'/first.ready') || ! is_file($directory.'/second.ready')) {
                if (microtime(true) >= $deadline) {
                    $this->fail('Checkout workers did not become ready: '.implode(' ', array_map(fn ($worker) => $worker->getErrorOutput(), $workers)));
                }
                usleep(10000);
            }
            file_put_contents($directory.'/start', 'start');
            foreach ($workers as $worker) {
                $this->assertSame(0, $worker->wait(), $worker->getErrorOutput());
            }
            $this->assertSame(trim($workers[0]->getOutput()), trim($workers[1]->getOutput()));
            $this->assertDatabaseCount('orders', 1);
            $this->assertDatabaseCount('payments', 1);
            $this->assertDatabaseCount('checkout_requests', 1);
            $this->assertDatabaseHas('payments', ['status' => 'paid', 'amount' => 10000]);
            $this->assertSame(4, $product->fresh()->stock);
        } finally {
            foreach ($workers as $worker) {
                $worker->stop();
            }
            foreach (['first.ready', 'second.ready', 'start'] as $file) {
                if (is_file($directory.'/'.$file)) {
                    unlink($directory.'/'.$file);
                }
            }
            rmdir($directory);
        }
    }
}
