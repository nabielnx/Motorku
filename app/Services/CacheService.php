<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;

/**
 * Centralized cache key management for the application.
 *
 * All cache keys and TTLs are defined here so that cache invalidation
 * is consistent across controllers and services.
 */
class CacheService
{
    // ── Cache Keys ──────────────────────────────────────────
    public const SETTINGS_SHARED = 'app:settings:shared';    // HandleInertiaRequests

    public const SETTINGS_STORE = 'app:settings:store';     // CustomerMenuController

    public const SETTINGS_ALL = 'app:settings:all';       // Full settings map

    public const CATALOG_DATA = 'app:catalog:data';       // CustomerMenuController

    public const MOTORCYCLES_LIST = 'app:motorcycles:list';   // MotorSayaController

    public const MOTORCYCLE_PARTS_PREFIX = 'app:motorcycle:parts:'; // per motorcycle

    // ── TTLs (seconds) ─────────────────────────────────────
    public const TTL_SETTINGS = 3600;  // 60 min — settings rarely change

    public const TTL_CATALOG = 300;   // 5 min  — products/orders change more often

    public const TTL_MOTORCYCLE = 1800;  // 30 min — motorcycle data changes infrequently

    /**
     * Flush all settings-related caches.
     */
    public static function flushSettings(): void
    {
        Cache::forget(self::SETTINGS_SHARED);
        Cache::forget(self::SETTINGS_STORE);
        Cache::forget(self::SETTINGS_ALL);
    }

    /**
     * Flush catalog data cache (products, sales, categories).
     */
    public static function flushCatalog(): void
    {
        Cache::forget(self::CATALOG_DATA);
    }

    /**
     * Flush all motorcycle-related caches.
     */
    public static function flushMotorcycles(): void
    {
        Cache::forget(self::MOTORCYCLES_LIST);
        // Pattern-based flush for per-motorcycle parts caches
        // Since database cache driver doesn't support tags, we use a version key
        if (! Cache::has('app:motorcycle:parts:version')) {
            Cache::forever('app:motorcycle:parts:version', 1);
        } else {
            Cache::increment('app:motorcycle:parts:version');
        }
    }

    /**
     * Get the versioned cache key for a specific motorcycle's parts.
     */
    public static function motorcyclePartsKey(string $motorcycleId): string
    {
        $version = (int) Cache::get('app:motorcycle:parts:version', 0);

        return self::MOTORCYCLE_PARTS_PREFIX.$motorcycleId.':v'.$version;
    }

    /**
     * Flush everything (useful after deploy or reset).
     */
    public static function flushAll(): void
    {
        self::flushSettings();
        self::flushCatalog();
        self::flushMotorcycles();
    }
}
