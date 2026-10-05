<?php

namespace App\Models;

use App\Services\DocumentNumberService;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    use HasFactory, HasUuids;

    protected static function booted(): void
    {
        static::deleting(fn (Payment $document) => app(DocumentNumberService::class)->remember('invoice', $document->invoice_number));
    }

    protected $fillable = [
        'order_id',
        'payment_method',
        'payment_channel',
        'amount',
        'amount_received',
        'change_amount',
        'notes',
        'status',
        'user_id',
        'invoice_number',
        'gateway_reference',
        'reference_number',
        'reference_number',
        'paid_at',
        'raw_response',
        'expired_at',
        'sync_version',
    ];

    protected function casts(): array
    {
        return [
            'raw_response' => 'array',
            'paid_at' => 'datetime',
            'expired_at' => 'datetime',
        ];
    }

    // WAJIB DITAMBAHKAN AGAR SERVICE BISA BERJALAN
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
