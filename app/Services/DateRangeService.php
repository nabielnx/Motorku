<?php

declare(strict_types=1);

namespace App\Services;

use Carbon\Carbon;

final class DateRangeService
{
    public function preset(string $period): array
    {
        $end = Carbon::today();
        $start = match ($period) {
            'today' => $end->copy(),
            '7_days' => $end->copy()->subDays(6),
            '30_days' => $end->copy()->subDays(29),
            'this_year' => $end->copy()->startOfYear(),
            default => $end->copy()->startOfMonth(),
        };

        return ['start_date' => $start->toDateString(), 'end_date' => $end->toDateString()];
    }
}
