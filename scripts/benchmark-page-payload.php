<?php

declare(strict_types=1);

use App\Http\Controllers\Dashboard\PosController;
use App\Http\Controllers\Order\CustomerMenuController;
use App\Http\Controllers\Product\ProductController;
use App\Models\Category;
use App\Models\Motorcycle;
use App\Models\MotorcyclePart;
use App\Models\Product;
use App\Services\SettingService;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

// Generated fixtures only, rolled back after each run. Never use an operational database.
require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();
if (! $app->environment('testing') || DB::connection()->getDriverName() !== 'mysql' || DB::connection()->getDatabaseName() !== 'sparepart_testing') {
    fwrite(STDERR, "This benchmark only runs against MySQL sparepart_testing.\n");
    exit(1);
}

DB::beginTransaction();
try {
    app(SettingService::class)->saveAll([['group' => 'qr_order', 'key' => 'enabled', 'value' => 'true']]);
    $root = Category::create(['name' => 'Benchmark Root', 'catalog_group' => 'automotive']);
    $category = Category::create(['name' => 'Benchmark Parts', 'parent_id' => $root->id, 'catalog_group' => 'automotive']);
    $motors = collect(range(1, 12))->map(fn ($i) => Motorcycle::create([
        'brand' => 'Benchmark', 'model' => 'Motor '.$i, 'slug' => 'benchmark-'.uniqid().'-'.$i, 'year_start' => 2020, 'engine_cc' => 110,
    ]));
    foreach (range(1, 236) as $i) {
        $product = Product::create([
            'category_id' => $category->id, 'sku' => 'BENCH-'.uniqid().'-'.$i, 'name' => 'Benchmark sparepart '.$i,
            'description' => 'Generated fixture for repeatable payload measurement.', 'price' => 15000 + $i * 100, 'stock' => 50, 'is_available' => true,
        ]);
        foreach ([$motors[$i % 12], $motors[($i + 1) % 12]] as $motor) {
            MotorcyclePart::create(['motorcycle_id' => $motor->id, 'product_id' => $product->id, 'part_category' => 'oli', 'notes' => 'Generated mapping', 'is_recommended' => $i % 5 === 0]);
        }
    }
    $cases = [
        'catalog' => [fn ($request) => app(CustomerMenuController::class)->index(), 'Order/Menu', null],
        'pos' => [fn ($request) => app(PosController::class)->index(), 'POS/Index', null],
        'product_partial' => [fn ($request) => app(ProductController::class)->indexWeb($request), 'Product/Index', 'initialProducts'],
    ];
    foreach ($cases as $case => [$controller, $component, $only]) {
        $runs = [];
        for ($run = 0; $run < 6; $run++) {
            $request = Request::create('/products', 'GET', [], [], [], ['HTTP_X_INERTIA' => 'true']);
            if ($only) {
                $request->headers->set('X-Inertia-Partial-Component', $component);
                $request->headers->set('X-Inertia-Partial-Data', $only);
            }
            DB::enableQueryLog();
            DB::flushQueryLog();
            $start = hrtime(true);
            $response = $controller($request)->toResponse($request);
            $body = $response->getContent();
            $milliseconds = (hrtime(true) - $start) / 1e6;
            $queries = count(DB::getQueryLog());
            DB::disableQueryLog();
            if ($response->getStatusCode() !== 200 || ! isset(json_decode($body, true)['props']['initialProducts'])) {
                throw new LogicException('Benchmark did not return the expected product payload.');
            }
            if ($run > 0) {
                $runs[] = ['milliseconds' => round($milliseconds, 2), 'queries' => $queries, 'bytes' => strlen($body), 'gzip_bytes' => strlen(gzencode($body))];
            }
        }
        $times = array_column($runs, 'milliseconds');
        sort($times);
        echo json_encode(['case' => $case, 'metric' => 'controller and JSON serialization, warm application, generated test data', 'median_ms' => $times[2], 'runs' => $runs], JSON_UNESCAPED_SLASHES).PHP_EOL;
    }
} finally {
    DB::rollBack();
}
