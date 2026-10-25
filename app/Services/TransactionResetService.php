<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\User;
use App\Notifications\StoreActivity;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\HttpException;

/** Permanently removes one business's operational history while retaining its master data. */
final class TransactionResetService
{
    /**
     * @return array<string, int>
     */
    public function reset(): array
    {
        if (! app(DeletionControlService::class)->enabled()) {
            throw new HttpException(403, DeletionControlService::MESSAGE);
        }

        return DB::transaction(function (): array {
            $business = app(BusinessContext::class);
            $deleted = [];

            // Delete dependent records first. Query Builder is intentional: no new
            // notifications, document-sequence updates, or stock mutations are emitted.
            foreach ([
                'order_returns',
                'payments',
                'order_items',
                'orders',
                'inventory_logs',
                'cash_closings',
                'checkout_requests',
                'document_sequences',
                'cash_day_locks',
            ] as $table) {
                $deleted[$table] = $business->table($table)->delete();
            }

            $userIds = User::query()->pluck('id');
            $deleted['activity_notifications'] = $userIds->isEmpty()
                ? 0
                : DatabaseNotification::query()
                    ->where('type', StoreActivity::class)
                    ->where('notifiable_type', User::class)
                    ->whereIn('notifiable_id', $userIds)
                    ->delete();

            return $deleted;
        });
    }
}
