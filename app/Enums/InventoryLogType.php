<?php

namespace App\Enums;

enum InventoryLogType: string
{
    case StockIn = 'stock_in';
    case StockOut = 'stock_out';
    case Adjustment = 'adjustment';
    case StockReturn = 'stock_return';

    public function label(): string
    {
        return match ($this) {
            self::StockIn    => 'Stok Masuk',
            self::StockOut   => 'Stok Keluar',
            self::Adjustment => 'Penyesuaian',
            self::StockReturn => 'Stok Kembali',
        };
    }

    /**
     * Return the opposite type for reversal operations.
     */
    public function opposite(): self
    {
        return match ($this) {
            self::StockIn    => self::StockOut,
            self::StockOut   => self::StockIn,
            self::Adjustment => self::Adjustment,
            self::StockReturn => self::StockOut,
        };
    }
}
