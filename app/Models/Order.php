<?php

namespace App\Models;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Services\DocumentNumberService;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    use HasFactory, HasUuids;

    protected static function booted(): void
    {
        static::deleting(fn (Order $document) => app(DocumentNumberService::class)->remember('order', $document->order_number));
    }

    protected $fillable = [
        'cashier_id',
        'order_number',
        'customer_name',
        'customer_phone',
        'customer_access_token',
        'subtotal',
        'discount_amount',
        'tax_amount',
        'total',
        'notes',
        'order_status',
        'payment_status',
        'sync_version',
        'ordered_at',
        'expires_at',
    ];

    protected $hidden = [
        'customer_access_token',
    ];

    protected $casts = [
        'subtotal' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'total' => 'decimal:2',
        'order_status' => OrderStatus::class,
        'payment_status' => PaymentStatus::class,
        'ordered_at' => 'datetime',
        'expires_at' => 'datetime',
        'created_at' => 'datetime',
    ];

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function cashier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cashier_id');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function returns(): HasMany
    {
        return $this->hasMany(OrderReturn::class);
    }

    /**
     * Scope a query to only include paid orders within a specific date range.
     * Includes orders not cancelled and with at least one 'paid' payment within the range.
     *
     * @param  Builder  $query
     * @param  Carbon|string  $startDate
     * @param  Carbon|string  $endDate
     * @return Builder
     */
    public function scopePaidWithinRange($query, $startDate, $endDate)
    {
        $start = $startDate instanceof Carbon ? $startDate->copy() : Carbon::parse($startDate);
        $end = $endDate instanceof Carbon ? $endDate->copy() : Carbon::parse($endDate);

        if (is_string($startDate) && strlen($startDate) <= 10) {
            $start = $start->startOfDay();
        }

        if (is_string($endDate) && strlen($endDate) <= 10) {
            $end = $end->endOfDay();
        }

        return $query->where('order_status', '!=', OrderStatus::Cancelled)
            ->whereHas('payments', function ($q) use ($start, $end) {
                $q->where('status', 'paid')
                    ->whereBetween('paid_at', [$start, $end]);
            });
    }

    /**
     * Scope a query to only include paid orders (no date filter).
     *
     * @param  Builder  $query
     * @return Builder
     */
    public function scopePaid($query)
    {
        return $query->where('order_status', '!=', OrderStatus::Cancelled)
            ->whereHas('payments', function ($q) {
                $q->where('status', 'paid');
            });
    }

    /**
     * Scope: stale orders eligible for auto-expiry.
     */
    public function scopeStale($query)
    {
        return $query->where('order_status', OrderStatus::Pending)
            ->where('payment_status', PaymentStatus::Unpaid)
            ->whereNotNull('expires_at')
            ->where('expires_at', '<=', now());
    }
}
