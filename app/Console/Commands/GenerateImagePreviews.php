<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\Business;
use App\Services\ImagePreviewBackfillService;
use Illuminate\Console\Command;
use Illuminate\Support\Str;

final class GenerateImagePreviews extends Command
{
    protected $signature = 'images:previews {business : UUID usaha} {--limit=100 : Maksimal produk per batch, 1-1000} {--after= : UUID produk terakhir dari batch sebelumnya} {--apply : Buat pratinjau; tanpa opsi ini hanya dry-run}';

    protected $description = 'Buat pratinjau gambar lama per usaha tanpa mengubah file asli (dry-run secara default)';

    public function handle(ImagePreviewBackfillService $backfill): int
    {
        $limit = filter_var($this->option('limit'), FILTER_VALIDATE_INT);
        $after = $this->option('after');
        $businessId = (string) $this->argument('business');
        if (! Str::isUuid($businessId) || $limit === false || $limit < 1 || $limit > 1000 || ($after && ! Str::isUuid($after))) {
            $this->error('Gunakan UUID usaha/produk yang valid dan limit 1-1000.');

            return self::FAILURE;
        }
        $business = Business::find($businessId);
        if (! $business) {
            $this->error('Usaha tidak ditemukan.');

            return self::FAILURE;
        }

        $result = $backfill->run($business->id, $limit, $after, (bool) $this->option('apply'));
        $this->info(($this->option('apply') ? 'Apply' : 'Dry-run').": products={$result['products']}, candidates={$result['candidates']}, created={$result['created']}, failed={$result['failed']}");
        if ($result['after']) {
            $this->line('Next --after='.$result['after']);
        }

        return $result['failed'] ? self::FAILURE : self::SUCCESS;
    }
}
