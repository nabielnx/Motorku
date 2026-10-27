<?php

declare(strict_types=1);
use App\Services\BusinessContext;
use App\Services\ImagePreviewService;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\Storage;

foreach (['APP_ENV' => 'testing', 'DB_DATABASE' => 'tokom_testing', 'APP_CONFIG_CACHE' => 'bootstrap/cache/testing-config.php', 'CACHE_STORE' => 'array', 'SESSION_DRIVER' => 'array'] as $key => $value) {
    putenv($key.'='.$value);
    $_ENV[$key] = $_SERVER[$key] = $value;
}
$root = dirname(__DIR__, 2);
require $root.'/vendor/autoload.php';
$app = require $root.'/bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();
if (! $app->environment('testing') || config('database.connections.mysql.database') !== 'tokom_testing') {
    throw new LogicException('Isolated testing configuration required.');
}
$disk = Storage::build(['driver' => 'local', 'root' => storage_path('app/private/image-preview-benchmark-fixture')]);
Storage::set('public', $disk);
$image = imagecreatetruecolor(1200, 1200);
for ($i = 0; $i < 240; $i++) {
    imagefilledrectangle($image, ($i * 37) % 1200, ($i * 79) % 1200, min(1199, ($i * 37) % 1200 + 80), min(1199, ($i * 79) % 1200 + 100), (($i * 137) % 0xFFFFFF));
}
ob_start();
imagewebp($image, null, 85);
$bytes = ob_get_clean();
imagedestroy($image);
$path = 'products/'.BusinessContext::LEGACY_ID.'/sample.webp';
$disk->put($path, $bytes);
$runs = [];
for ($index = 0; $index < 3; $index++) {
    $disk->delete(ImagePreviewService::path($path));
    $preview = app(ImagePreviewService::class)->generate($path);
    $size = getimagesize($disk->path($preview));
    $runs[] = ['originalBytes' => strlen($bytes), 'originalPixels' => [1200, 1200], 'previewBytes' => $disk->size($preview), 'previewPixels' => [$size[0], $size[1]], 'files' => count($disk->allFiles())];
}
$result = ['dataset' => 'one deterministic synthetic product photo, 3 repeated encodes; no production uploads touched', 'runs' => $runs];
echo json_encode($result, JSON_PRETTY_PRINT), PHP_EOL;
