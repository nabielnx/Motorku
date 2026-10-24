<?php

declare(strict_types=1);

namespace App\Services;

use JsonException;

class LoadingSkeletonService
{
    private string $directory;

    public function __construct(?string $directory = null)
    {
        $this->directory = $directory ?? public_path('build/skeletons');
    }

    public function forPage(string $component): ?array
    {
        $manifest = [];
        $manifestPath = $this->directory.'/manifest.json';
        if (is_file($manifestPath) && is_readable($manifestPath)) {
            try {
                $manifest = json_decode(file_get_contents($manifestPath), true, 512, JSON_THROW_ON_ERROR);
            } catch (JsonException) {
                $manifest = [];
            }
        }
        if (! is_array($manifest) || ($manifest['version'] ?? null) !== 1) {
            $manifest = [];
        }
        $key = $manifest['pages'][$component] ?? null;
        $key = is_string($key) ? $key : null;
        if (! $key && ! $this->isAdminPage($component)) {
            return null;
        }
        $definition = $manifest['skeletons'][$key ?? ''] ?? [];
        $definition = is_array($definition) ? $definition : [];
        $variants = [];
        foreach (is_array($definition['variants'] ?? null) ? $definition['variants'] : [] as $view => $filename) {
            if (! is_string($filename) || ! preg_match('/\A[a-z0-9-]+\.html\z/', $filename)) {
                continue;
            }
            $path = $this->directory.'/'.$filename;
            if (is_file($path) && is_readable($path)) {
                $variants[$view] = file_get_contents($path);
            }
        }

        return [
            'key' => $key ?? 'generic',
            'noPadding' => (bool) ($definition['noPadding'] ?? false),
            'storageKey' => is_string($definition['storageKey'] ?? null) ? $definition['storageKey'] : null,
            'defaultView' => is_string($definition['defaultView'] ?? null) ? $definition['defaultView'] : 'default',
            'variants' => $variants,
        ];
    }

    private function isAdminPage(string $component): bool
    {
        return str_starts_with($component, 'Dashboard/') || in_array($component, [
            'POS/Index', 'Product/Index', 'Order/Index', 'Order/Show', 'User/Index',
            'Report/Index', 'Setting/Index', 'Motorcycle/Index', 'Profile/Edit',
            'DataType/Index', 'Reference/Index', 'Supplier/Index',
        ], true);
    }
}
