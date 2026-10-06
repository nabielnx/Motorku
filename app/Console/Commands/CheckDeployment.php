<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class CheckDeployment extends Command
{
    protected $signature = 'app:check-deployment';

    protected $description = 'Check deployment configuration without changing data or exposing secrets.';

    public function handle(): int
    {
        $checks = [
            'Environment production/staging' => app()->environment(['production', 'staging']),
            'Debug disabled' => ! config('app.debug'),
            'HTTPS application URL' => str_starts_with(config('app.url'), 'https://'),
            'Application key configured' => filled(config('app.key')),
            'Secure session cookies' => (bool) config('session.secure'),
            'GD with WebP support' => extension_loaded('gd') && (gd_info()['WebP Support'] ?? false),
            'Storage writable' => is_writable(storage_path()) && is_writable(base_path('bootstrap/cache')),
            'Public storage link' => is_link(public_path('storage')),
            'Uploads allow 4 MB' => $this->megabytes(ini_get('upload_max_filesize')) >= 4 && $this->megabytes(ini_get('post_max_size')) >= 8,
        ];
        try {
            DB::select('SELECT 1');
            $checks['Database reachable'] = true;
            $checks['Active owner exists'] = User::role('owner')->where('is_active', true)->exists();
            $checks['No demo passwords'] = ! User::whereIn('email', ['owner@tokosparepart.com', 'andi@tokosparepart.com', 'siti@tokosparepart.com'])->get()
                ->contains(fn ($user) => Hash::check('password', $user->password));
        } catch (\Throwable) {
            $checks['Database/schema available'] = false;
        }
        foreach ($checks as $name => $passed) {
            $passed ? $this->info('OK: '.$name) : $this->error('FAIL: '.$name);
        }
        $this->line('Scheduler, HTTPS/proxy upload limits, mail delivery, and backup restore must also be tested on the host.');

        return in_array(false, $checks, true) ? self::FAILURE : self::SUCCESS;
    }

    private function megabytes(string $value): float
    {
        $unit = strtolower(substr(trim($value), -1));

        return (float) $value * match ($unit) {
            'g' => 1024, 'm' => 1, 'k' => 1 / 1024, default => 1 / 1048576
        };
    }
}
