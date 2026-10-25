<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Services\DeploymentBackupService;
use Illuminate\Console\Command;

final class PreviewDeploymentBackups extends Command
{
    protected $signature = 'deploy:preview-backup-retention {--keep=10} {--days=30}';

    protected $description = 'Read-only preview of old complete backup pairs; no files are removed.';

    public function handle(DeploymentBackupService $backups): int
    {
        $keep = filter_var($this->option('keep'), FILTER_VALIDATE_INT, ['options' => ['min_range' => 2, 'max_range' => 1000]]);
        $days = filter_var($this->option('days'), FILTER_VALIDATE_INT, ['options' => ['min_range' => 7, 'max_range' => 3650]]);
        if ($keep === false || $days === false) {
            $this->error('Keep at least 2 backup pairs and at least 7 days.');

            return self::FAILURE;
        }
        try {
            $candidates = $backups->candidates(base_path(), $keep, $days);
            $this->table(['Backup pair', 'Bytes'], array_map(fn ($row) => [$row['name'], $row['bytes']], $candidates));
            $this->info('Dry-run only; no backup files were deleted.');

            return self::SUCCESS;
        } catch (\RuntimeException $exception) {
            $this->error($exception->getMessage());

            return self::FAILURE;
        }
    }
}
