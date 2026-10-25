<?php

declare(strict_types=1);

namespace App\Support;

use Illuminate\Validation\ValidationException;

final class DomainLimits
{
    // Whole rupiah and whole units, within decimal(15,2) / decimal(10,2).
    public const MAX_AMOUNT = 9_999_999_999_999;

    public const MAX_STOCK = 99_999_999;

    public static function amount(float $amount, string $field = 'items'): float
    {
        if (! is_finite($amount) || $amount < 0 || $amount > self::MAX_AMOUNT) {
            throw ValidationException::withMessages([$field => 'Nominal melebihi batas transaksi yang didukung.']);
        }

        return $amount;
    }
}
