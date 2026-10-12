<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('orders:expire-stale')
    ->everyMinute()
    ->withoutOverlapping();

Schedule::command('notifications:prune-read')
    ->dailyAt('03:00')
    ->withoutOverlapping();

Artisan::command('products:prune-imports', function () {
    $count = DB::table('product_sheet_imports')->where('expires_at', '<', now())->delete();
    $this->info("Deleted {$count} expired product imports.");
})->purpose('Delete expired private product import drafts');

Schedule::command('products:prune-imports')->hourly()->withoutOverlapping();
