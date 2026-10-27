<?php

declare(strict_types=1);

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use PDO;

abstract class TestCase extends BaseTestCase
{
    // Opt in to the seeded store explicitly; unscoped requests remain testable.
    protected function storeUrl(string $path): string
    {
        if ($path === '/') {
            return '/s/toko-utama';
        }
        if (preg_match('/[?&]shop(?:=|\[)/', $path)) {
            return $path;
        }

        return $path.(str_contains($path, '?') ? '&' : '?').'shop=toko-utama';
    }

    public function createApplication()
    {
        $app = parent::createApplication();
        if (! $app->environment('testing') || $app['db']->connection()->getDriverName() !== 'mysql' || $app['db']->connection()->getDatabaseName() !== 'tokom_testing') {
            throw new \LogicException('Test application must use the MySQL tokom_testing database. Clear stale config cache first.');
        }

        return $app;
    }

    public static function setUpBeforeClass(): void
    {
        parent::setUpBeforeClass();
        static::ensureTestDatabaseExists();
    }

    protected static function ensureTestDatabaseExists(): void
    {
        if (env('DB_CONNECTION', 'mysql') !== 'mysql' || env('DB_DATABASE', 'tokom_testing') !== 'tokom_testing') {
            throw new \LogicException('Tests may only modify the MySQL tokom_testing database.');
        }
        $host = env('DB_HOST', '127.0.0.1');
        $port = env('DB_PORT', '3306');
        $pdo = new PDO("mysql:host={$host};port={$port}", env('DB_USERNAME', 'root'), env('DB_PASSWORD', ''));
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $pdo->exec('CREATE DATABASE IF NOT EXISTS `tokom_testing` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
    }
}
