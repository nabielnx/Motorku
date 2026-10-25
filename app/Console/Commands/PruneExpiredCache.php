<?php

declare(strict_types=1);

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

final class PruneExpiredCache extends Command
{
    protected $signature = 'cache:prune-expired {--batch=1000} {--batches=20} {--dry-run}';

    protected $description = 'Remove expired database cache rows in bounded batches without flushing live keys.';

    public function handle(): int
    {
        $store = config('cache.stores.'.config('cache.default'));
        if (($store['driver'] ?? null) !== 'database') {
            $this->info('No database cache configured; nothing to prune.');

            return self::SUCCESS;
        }
        $batch = filter_var($this->option('batch'), FILTER_VALIDATE_INT, ['options' => ['min_range' => 1, 'max_range' => 10000]]);
        $batches = filter_var($this->option('batches'), FILTER_VALIDATE_INT, ['options' => ['min_range' => 1, 'max_range' => 100]]);
        if ($batch === false || $batches === false) {
            $this->error('Invalid batch size/count.');

            return self::FAILURE;
        }
        $table = DB::connection($store['connection'] ?? null)->table($store['table'] ?? 'cache');
        $cutoff = now()->timestamp;
        $deleted = 0;
        for ($i = 0; $i < $batches; $i++) {
            $keys = (clone $table)->where('expiration', '<', $cutoff)->orderBy('key')->limit($batch)->pluck('key');
            if ($keys->isEmpty()) {
                break;
            }
            if ($this->option('dry-run')) {
                $this->info('Expired rows in next batch: '.$keys->count());

                return self::SUCCESS;
            }
            // A concurrent cache put may have renewed a selected key.
            $deleted += (clone $table)->whereIn('key', $keys)->where('expiration', '<', $cutoff)->delete();
        }
        $this->info('Expired cache rows removed: '.$deleted);

        return self::SUCCESS;
    }
}
