<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use PDO;

abstract class TestCase extends BaseTestCase
{
    public static function setUpBeforeClass(): void
    {
        parent::setUpBeforeClass();
        static::ensureTestDatabaseExists();
    }

    protected static function ensureTestDatabaseExists(): void
    {
        $connection = env('DB_CONNECTION', 'mysql');

        if ($connection === 'mysql') {
            $host = env('DB_HOST', '127.0.0.1');
            $port = env('DB_PORT', '3306');
            $username = env('DB_USERNAME', 'root');
            $password = env('DB_PASSWORD', '');
            $database = env('DB_DATABASE', 'sparepart_testing');

            try {
                $pdo = new PDO("mysql:host={$host};port={$port}", $username, $password);
                $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
                $pdo->exec("CREATE DATABASE IF NOT EXISTS `{$database}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;");
            } catch (\Throwable $e) {
                // Ignore connection errors if handled by test suite
            }
        } elseif ($connection === 'pgsql') {
            $host = env('DB_HOST', '127.0.0.1');
            $port = env('DB_PORT', '5432');
            $username = env('DB_USERNAME', 'postgres');
            $password = env('DB_PASSWORD', '');
            $database = env('DB_DATABASE', 'sparepart_testing');

            try {
                $pdo = new PDO("pgsql:host={$host};port={$port};dbname=postgres", $username, $password);
                $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
                $stmt = $pdo->prepare("SELECT 1 FROM pg_database WHERE datname = :dbname");
                $stmt->execute(['dbname' => $database]);

                if (!$stmt->fetchColumn()) {
                    $pdo->exec("CREATE DATABASE \"{$database}\";");
                }
            } catch (\Throwable $e) {
                // Ignore connection errors if handled by test suite
            }
        }
    }
}
