<?php

// Runs on the deployment host; the password stays out of command arguments/logs.
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\DB;

$root = realpath($argv[1] ?? '');
$destination = $argv[2] ?? '';
if (! $root || ! is_dir($root.'/storage') || realpath(dirname($destination)) !== realpath($root.'/.deploy-backups') || file_exists($destination)) {
    throw new RuntimeException('Invalid deployment backup path.');
}
require $root.'/vendor/autoload.php';
$app = require $root.'/bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();
$connection = DB::connection()->getConfig();
if (($connection['driver'] ?? null) !== 'mysql') {
    throw new RuntimeException('Deployment backup requires MySQL.');
}
umask(0077);
$command = [
    'mysqldump', '--single-transaction', '--quick', '--skip-lock-tables', '--no-tablespaces',
    '--host='.$connection['host'], '--port='.$connection['port'], '--user='.$connection['username'],
];
if (! empty($connection['unix_socket'])) {
    $command[] = '--socket='.$connection['unix_socket'];
}
$command[] = $connection['database'];
$process = proc_open($command, [0 => ['file', '/dev/null', 'r'], 1 => ['file', $destination, 'w'], 2 => STDERR], $pipes, $root, [
    ...getenv(), 'MYSQL_PWD' => $connection['password'],
]);
if (! is_resource($process) || proc_close($process) !== 0 || ! is_file($destination) || filesize($destination) === 0) {
    if (is_file($destination)) {
        unlink($destination);
    }
    throw new RuntimeException('Database backup failed; deployment stopped.');
}
