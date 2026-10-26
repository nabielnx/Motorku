<?php

declare(strict_types=1);

// Local fixtures only. No migrations, schema resets, email or production requests.
use App\Http\Controllers\Product\ProductController;
use App\Models\Category;
use App\Models\Motorcycle;
use App\Models\Product;
use App\Services\BenchmarkBaselineCatalogSearchService;
use App\Services\BusinessContext;
use App\Services\CatalogPageService;
use App\Services\CatalogSearchService;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Symfony\Component\Process\Process;

$options = getopt('', ['baseline-ref:', 'samples:', 'cache:']);
$samples = (int) ($options['samples'] ?? 5);
$cache = $options['cache'] ?? 'array';
if ($samples < 3 || $samples > 7 || ! in_array($cache, ['array', 'database'], true)) {
    throw new InvalidArgumentException('Use 3-7 samples and cache=array or database.');
}
$root = dirname(__DIR__);
foreach (['APP_ENV' => 'testing', 'APP_CONFIG_CACHE' => 'bootstrap/cache/testing-config.php', 'DB_CONNECTION' => 'mysql', 'DB_HOST' => '127.0.0.1', 'DB_PORT' => '3306', 'DB_DATABASE' => 'tokom_testing', 'CACHE_STORE' => $cache, 'MAIL_MAILER' => 'array', 'QUEUE_CONNECTION' => 'sync', 'SESSION_DRIVER' => 'array'] as $key => $value) {
    putenv($key.'='.$value);
    $_ENV[$key] = $_SERVER[$key] = $value;
}
require $root.'/vendor/autoload.php';
$app = require $root.'/bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();
set_exception_handler(static function (Throwable $exception): never {
    $detail = $exception instanceof LogicException ? $exception->getMessage() : $exception::class;
    fwrite(STDERR, 'Benchmark failed: '.$detail.PHP_EOL);
    exit(1);
});
$db = DB::connection();
if (! $app->environment('testing') || $db->getDriverName() !== 'mysql' || $db->getConfig('host') !== '127.0.0.1' || $db->getDatabaseName() !== 'tokom_testing') {
    throw new LogicException('Benchmark requires local MySQL tokom_testing.');
}
if (Product::withoutGlobalScopes()->exists()) {
    throw new LogicException('Use an empty test catalog. Existing test data is never deleted by this script.');
}
config(['cache.stores.database.connection' => 'mysql']);
if (! str_contains((string) $db->getPdo()->getAttribute(PDO::ATTR_SERVER_VERSION), 'MariaDB')) {
    $db->statement('SET SESSION MAX_EXECUTION_TIME=5000');
}
$variants = [];
if ($ref = ($options['baseline-ref'] ?? null)) {
    if (! preg_match('/^[a-f0-9]{40}$/D', $ref)) {
        throw new InvalidArgumentException('Baseline must be a full local commit SHA.');
    }
    $process = new Process(['git', 'show', $ref.':app/Services/CatalogSearchService.php'], $root);
    $process->mustRun();
    $source = preg_replace('/\bclass CatalogSearchService\b/', 'class BenchmarkBaselineCatalogSearchService', $process->getOutput(), 1, $count);
    if ($count !== 1) {
        throw new LogicException('Unexpected baseline search service.');
    }
    $snapshot = $root.'/storage/app/private/catalog-benchmark-baseline-'.$ref.'.php';
    file_put_contents($snapshot, $source);
    require $snapshot;
    $variants['baseline-'.$ref] = BenchmarkBaselineCatalogSearchService::class;
}
$variants['working-tree'] = CatalogSearchService::class;
$cases = [
    'admin_broad' => ['search' => 'Benchmark'],
    'admin_fitment' => ['search' => 'Benchmark motor 3'],
    'admin_price_sort' => ['search' => 'Benchmark', 'sort' => 'price_asc'],
    'catalog_fitment' => ['search' => 'Benchmark motor 3'],
];
$fingerprints = [];
$initialLevel = $db->transactionLevel();
$db->beginTransaction();
try {
    $parent = Category::create(['name' => 'Benchmark Root', 'catalog_group' => 'automotive']);
    $category = Category::create(['name' => 'Benchmark Parts', 'parent_id' => $parent->id, 'catalog_group' => 'automotive']);
    $motors = collect(range(1, 12))->map(fn ($i) => Motorcycle::create(['brand' => 'Benchmark', 'model' => 'Motor '.$i, 'slug' => 'benchmark-'.Str::uuid(), 'year_start' => 2020, 'engine_cc' => 110]));
    $products = $parts = [];
    $now = now();
    foreach (range(1, 2000) as $i) {
        $id = (string) Str::uuid();
        $products[] = ['id' => $id, 'business_id' => BusinessContext::LEGACY_ID, 'category_id' => $category->id, 'sku' => 'BENCH-'.$i, 'name' => 'Benchmark sparepart '.$i, 'description' => 'Generated fixture for repeatable payload measurement.', 'price' => 15000 + $i * 100, 'stock' => 50, 'is_available' => true, 'created_at' => $now->copy()->subSeconds($i), 'updated_at' => $now];
        foreach ([$motors[$i % 12], $motors[($i + 1) % 12]] as $motor) {
            $parts[] = ['id' => (string) Str::uuid(), 'business_id' => BusinessContext::LEGACY_ID, 'product_id' => $id, 'motorcycle_id' => $motor->id, 'part_category' => 'oli', 'notes' => 'Generated mapping', 'is_recommended' => false, 'created_at' => $now, 'updated_at' => $now];
        }
    }
    foreach (['products' => $products, 'motorcycle_parts' => $parts] as $table => $rows) {
        foreach (array_chunk($rows, 250) as $chunk) {
            $db->table($table)->insert($chunk);
        }
    }
    unset($products, $parts);
    foreach ($variants as $variant => $class) {
        config(['cache.prefix' => 'benchmark-'.Str::uuid()]);
        Cache::purge($cache);
        $app->instance(CatalogSearchService::class, new $class);
        foreach ($cases as $case => $filters) {
            $runs = [];
            for ($run = 0; $run <= $samples; $run++) {
                $request = Request::create('/products', 'GET', $filters, [], [], ['HTTP_X_INERTIA' => 'true', 'HTTP_X_INERTIA_PARTIAL_COMPONENT' => 'Product/Index', 'HTTP_X_INERTIA_PARTIAL_DATA' => 'initialProducts']);
                $app->instance('request', $request);
                DB::enableQueryLog();
                DB::flushQueryLog();
                memory_reset_peak_usage();
                $start = hrtime(true);
                if ($case === 'catalog_fitment') {
                    $payload = app(CatalogPageService::class)->page($filters);
                    $body = json_encode($payload, JSON_THROW_ON_ERROR);
                    $ids = array_column($payload['products'], 'id');
                    $total = $payload['pagination']['total'];
                } else {
                    $response = app(ProductController::class)->indexWeb($request)->toResponse($request);
                    if ($response->getStatusCode() !== 200) {
                        throw new LogicException('Unexpected benchmark response.');
                    }
                    $body = $response->getContent();
                    $payload = json_decode($body, true, flags: JSON_THROW_ON_ERROR)['props']['initialProducts'];
                    $ids = array_column($payload['data'], 'id');
                    $total = $payload['total'];
                }
                $elapsed = (hrtime(true) - $start) / 1e6;
                $queries = DB::getQueryLog();
                DB::disableQueryLog();
                $fingerprint = hash('sha256', json_encode([$ids, $total], JSON_THROW_ON_ERROR));
                if (! $ids || isset($fingerprints[$case]) && $fingerprints[$case] !== $fingerprint) {
                    throw new LogicException('Result IDs, order or totals changed: '.$case);
                }
                $fingerprints[$case] = $fingerprint;
                if ($run > 0) {
                    $runs[] = ['ms' => round($elapsed, 2), 'queries' => count($queries), 'database_ms' => round(array_sum(array_column($queries, 'time')), 2), 'bytes' => strlen($body), 'process_peak_bytes' => memory_get_peak_usage(true)];
                }
            }
            $times = array_column($runs, 'ms');
            sort($times);
            echo json_encode(['variant' => $variant, 'case' => $case, 'cache' => $cache, 'products' => 2000, 'fitments' => 4000, 'median_ms' => $times[intdiv(count($times), 2)], 'total_matches' => $total, 'runs' => $runs], JSON_THROW_ON_ERROR).PHP_EOL;
        }
    }
} finally {
    DB::disableQueryLog();
    $db->rollBack($initialLevel);
}
if (Product::withoutGlobalScopes()->exists()) {
    throw new LogicException('Fixture rollback verification failed.');
}
echo json_encode(['fixtures_rolled_back' => true, 'same_result_ids_order_and_totals' => true], JSON_THROW_ON_ERROR).PHP_EOL;
