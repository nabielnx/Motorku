<?php

namespace App\Services;

use App\Models\CashClosing;
use App\Models\OrderReturn;
use App\Models\Payment;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CashClosingService
{
    public function summary(string $date): array
    {
        $day = Carbon::parse($date);
        $start = $day->copy()->startOfDay();
        $end = $day->copy()->endOfDay();

        return [
            'date' => $date,
            'cash_sales' => (float) Payment::where('payment_method', 'cash')
                ->whereIn('status', ['paid', 'refunded'])
                ->whereBetween('paid_at', [$start, $end])->sum('amount'),
            'cash_returns' => (float) OrderReturn::whereBetween('created_at', [$start, $end])->sum('amount'),
            'closing' => CashClosing::where('closing_date', $date)->first(),
        ];
    }

    public function close(array $data): CashClosing
    {
        return DB::transaction(function () use ($data) {
            if (CashClosing::where('closing_date', $data['date'])->lockForUpdate()->exists()) {
                throw ValidationException::withMessages(['date' => 'Kas untuk tanggal ini sudah ditutup.']);
            }

            $summary = $this->summary($data['date']);
            $expected = round((float) $data['opening_cash'] + $summary['cash_sales']
                - $summary['cash_returns'] - (float) $data['cash_out'], 2);

            return CashClosing::create([
                'closing_date' => $data['date'],
                'opening_cash' => $data['opening_cash'],
                'cash_out' => $data['cash_out'],
                'cash_sales' => $summary['cash_sales'],
                'cash_returns' => $summary['cash_returns'],
                'expected_cash' => $expected,
                'actual_cash' => $data['actual_cash'],
                'difference' => round((float) $data['actual_cash'] - $expected, 2),
                'notes' => $data['notes'] ?? null,
                'user_id' => auth()->id(),
            ]);
        });
    }
}
