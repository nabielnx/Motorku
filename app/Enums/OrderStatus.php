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
            self::Pending => [self::Preparing, self::Cancelled],
            self::Preparing => [self::Ready],
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

    public function label(): string
    {
        return match ($this) {
            self::Pending => 'Menunggu',
            self::Preparing => 'Sedang Disiapkan',
            self::Ready => 'Siap Diambil',
            self::Completed => 'Selesai',
            self::Cancelled => 'Dibatalkan',
        };
    }
}
