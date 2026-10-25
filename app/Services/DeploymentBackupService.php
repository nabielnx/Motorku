<?php

declare(strict_types=1);

namespace App\Services;

/** Read-only retention preview. Never deletes, moves or modifies backup files. */
final class DeploymentBackupService
{
    public function candidates(string $root, int $keep = 10, int $days = 30): array
    {
        $root = realpath($root);
        if (! $root || ! is_file($root.'/artisan') || ! is_file($root.'/.env') || ! is_dir($root.'/storage') || $keep < 2 || $days < 7) {
            throw new \RuntimeException('Invalid application root or unsafe retention policy.');
        }
        $directory = $root.'/.deploy-backups';
        if (! file_exists($directory)) {
            return [];
        }
        if (is_link($directory) || str_replace('\\', '/', (string) realpath($directory)) !== str_replace('\\', '/', $directory)) {
            throw new \RuntimeException('Backup directory must be a real directory inside the application.');
        }
        $groups = [];
        foreach (new \DirectoryIterator($directory) as $file) {
            if (! $file->isFile() || $file->isLink() || ! preg_match('/\A(\d{8}T\d{6}Z-\.incoming-[a-f0-9]{40})(\.sql|-code\.tgz)\z/D', $file->getFilename(), $match)) {
                continue;
            }
            $groups[$match[1]][$match[2]] = $file->getPathname();
        }
        $groups = array_filter($groups, fn ($files) => isset($files['.sql'], $files['-code.tgz']) && filesize($files['.sql']) > 0 && filesize($files['-code.tgz']) > 0);
        krsort($groups, SORT_STRING);
        $cutoff = time() - $days * 86400;
        $candidates = [];
        foreach (array_slice($groups, $keep, null, true) as $name => $files) {
            if (max(array_map('filemtime', $files)) < $cutoff) {
                $candidates[] = ['name' => $name, 'bytes' => array_sum(array_map('filesize', $files))];
            }
        }

        return $candidates;
    }
}
