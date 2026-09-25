<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class CashClosing extends Model
{
    use HasUuids;

    protected $fillable = [
        'closing_date', 'opening_cash', 'cash_out', 'cash_sales', 'cash_returns',
        'expected_cash', 'actual_cash', 'difference', 'notes', 'user_id',
    ];

    protected $casts = ['closing_date' => 'date:Y-m-d'];
}
