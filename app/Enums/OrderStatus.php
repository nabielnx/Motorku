<?php

namespace App\Enums;

enum OrderStatus: string
{
    case Pending = 'pending';
    case Preparing = 'preparing';
    case Ready = 'ready';
    case Completed = 'completed';
    case Cancelled = 'cancelled';

    /**
     * Valid transitions from this status.
     */
    public function allowedTransitions(): array
    {
        return match ($this) {
            self::Pending => [self::Preparing, self::Processing, self::Cancelled],
            self::Preparing, self::Processing => [self::Ready],
            self::Ready => [self::Completed],
            self::Completed, self::Cancelled => [],
        };
    }

    /**
     * Check if transition to the given status is allowed.
     */
    public function canTransitionTo(self $next): bool
    {
        if ($this === $next) {
            return true;
        }

        return in_array($next, $this->allowedTransitions(), true);
    }

    // 'processing' is an alias kept for backward compat with the existing
    // canTransition logic in OrderService (preparing & processing → ready).
    case Processing = 'processing';

    public function label(): string
    {
        return match ($this) {
            self::Pending    => 'Menunggu',
            self::Preparing  => 'Sedang Disiapkan',
            self::Processing => 'Diproses',
            self::Ready      => 'Siap Diambil',
            self::Completed  => 'Selesai',
            self::Cancelled  => 'Dibatalkan',
        };
    }
}
