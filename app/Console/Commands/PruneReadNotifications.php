<?php

namespace App\Console\Commands;

use App\Services\NotificationService;
use Illuminate\Console\Command;

class PruneReadNotifications extends Command
{
    protected $signature = 'notifications:prune-read';

    protected $description = 'Hapus notifikasi aktivitas toko yang sudah dibaca setidaknya 7 hari lalu.';

    public function handle(NotificationService $notifications): int
    {
        $deleted = $notifications->pruneRead();
        $this->info("{$deleted} notifikasi dibaca yang kedaluwarsa dihapus.");

        return self::SUCCESS;
    }
}
