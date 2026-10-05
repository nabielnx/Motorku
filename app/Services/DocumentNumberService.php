<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Payment;
use Illuminate\Support\Facades\DB;

class DocumentNumberService
{
    public function remember(string $type, ?string $documentNumber): void
    {
        $prefix = $type === 'order' ? 'ORD' : 'INV';
        if (! preg_match('/^'.$prefix.'-(\\d{4})(\\d{2})(\\d{2})-(\\d+)$/', $documentNumber ?? '', $matches)) {
            return;
        }
        $date = $matches[1].'-'.$matches[2].'-'.$matches[3];
        DB::transaction(function () use ($type, $date, $matches) {
            DB::table('document_sequences')->insertOrIgnore(['type' => $type, 'sequence_date' => $date, 'last_number' => 0]);
            $sequence = DB::table('document_sequences')->where('type', $type)->where('sequence_date', $date)->lockForUpdate()->first();
            DB::table('document_sequences')->where('type', $type)->where('sequence_date', $date)
                ->update(['last_number' => max((int) $sequence->last_number, (int) $matches[4])]);
        });
    }

    public function next(string $type): string
    {
        if (DB::transactionLevel() === 0) {
            throw new \LogicException('Nomor dokumen harus dibuat di dalam transaksi penyimpanan.');
        }

        [$model, $column, $prefix] = match ($type) {
            'order' => [Order::class, 'order_number', 'ORD'],
            'invoice' => [Payment::class, 'invoice_number', 'INV'],
            default => throw new \InvalidArgumentException('Jenis dokumen tidak dikenal.'),
        };

        $date = now()->toDateString();
        if (! DB::table('document_sequences')->where('type', $type)->where('sequence_date', $date)->exists()) {
            DB::table('document_sequences')->insertOrIgnore([
                'type' => $type,
                'sequence_date' => $date,
                'last_number' => 0,
            ]);
        }

        $sequence = DB::table('document_sequences')
            ->where('type', $type)
            ->where('sequence_date', $date)
            ->lockForUpdate()
            ->first();

        $lastNumber = (int) $sequence->last_number;
        $number = max(
            $lastNumber + 1,
            $lastNumber === 0
                ? $model::query()->whereDate('created_at', $date)->count() + 1
                : 1
        );

        do {
            $documentNumber = $prefix.'-'.str_replace('-', '', $date).'-'.str_pad((string) $number++, 4, '0', STR_PAD_LEFT);
        } while ($model::query()->where($column, $documentNumber)->exists());

        DB::table('document_sequences')
            ->where('type', $type)
            ->where('sequence_date', $date)
            ->update(['last_number' => $number - 1]);

        return $documentNumber;
    }
}
