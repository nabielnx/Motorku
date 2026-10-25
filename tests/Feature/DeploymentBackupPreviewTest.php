<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Services\DeploymentBackupService;
use Illuminate\Filesystem\Filesystem;
use Illuminate\Support\Str;
use Tests\TestCase;

final class DeploymentBackupPreviewTest extends TestCase
{
    private ?string $directory = null;

    protected function tearDown(): void
    {
        $resolved = $this->directory ? realpath($this->directory) : false;
        $parent = realpath(storage_path('framework/testing'));
        if ($resolved && $parent && str_starts_with($resolved, $parent.DIRECTORY_SEPARATOR)) {
            (new Filesystem)->deleteDirectory($resolved);
        }
        parent::tearDown();
    }

    public function test_preview_retains_latest_pairs_and_never_deletes_or_touches_unknown_files(): void
    {
        $this->directory = storage_path('framework/testing/backup-preview-'.Str::uuid());
        mkdir($this->directory.'/.deploy-backups', 0700, true);
        mkdir($this->directory.'/storage');
        file_put_contents($this->directory.'/artisan', 'test');
        file_put_contents($this->directory.'/.env', 'test');
        $paths = [];
        foreach (range(1, 5) as $number) {
            $name = '20200101T000000Z-.incoming-'.str_pad((string) $number, 40, '0', STR_PAD_LEFT);
            foreach (['.sql', '-code.tgz'] as $suffix) {
                $path = $this->directory.'/.deploy-backups/'.$name.$suffix;
                file_put_contents($path, 'fixture');
                touch($path, strtotime('2020-01-01'));
                $paths[] = $path;
            }
        }
        $unknown = $this->directory.'/.deploy-backups/private.env';
        file_put_contents($unknown, 'keep');
        $candidates = app(DeploymentBackupService::class)->candidates($this->directory, 2, 30);
        $this->assertCount(3, $candidates);
        foreach ([...$paths, $unknown] as $path) {
            $this->assertFileExists($path);
        }
    }

    public function test_preview_rejects_a_directory_without_application_markers(): void
    {
        $this->expectException(\RuntimeException::class);
        app(DeploymentBackupService::class)->candidates(storage_path('framework/testing'));
    }
}
