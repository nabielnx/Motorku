<?php

declare(strict_types=1);

namespace App\Support;

use App\Services\BusinessContext;
use Illuminate\Support\Facades\Storage;

final class BusinessFiles
{
    public static function delete(string|array $paths): bool
    {
        if (is_string($paths)) {
            return self::owns($paths) && Storage::disk('public')->delete($paths);
        }
        $owned = array_values(array_filter((array) $paths, fn ($path) => is_string($path) && self::owns($path)));

        return $owned !== [] && Storage::disk('public')->delete($owned);
    }

    public static function owns(string $path): bool
    {
        if (str_contains($path, '..') || str_contains($path, '\\') || str_starts_with($path, '/') || str_contains($path, '://')) {
            return false;
        }
        $segments = explode('/', $path);
        $id = app(BusinessContext::class)->id();

        // Existing files have directory/uuid.webp; keep them with the original shop.
        return count($segments) >= 3
            ? $segments[1] === $id
            : count($segments) === 2 && $id === BusinessContext::LEGACY_ID;
    }
}
