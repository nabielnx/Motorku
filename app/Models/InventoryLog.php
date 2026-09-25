<?php

namespace App\Models;

use App\Enums\InventoryLogType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class InventoryLog extends Model
{
    use HasUuids, SoftDeletes;

    protected $fillable = [
        'product_id',
        'user_id',
        'type',
        'quantity',
        'note',
        'previous_stock',
        'new_stock',
        'reference_type',
        'reference_id',
        'sync_version'
    ];

    protected $casts = [
        'type'       => InventoryLogType::class,
        'quantity'   => 'integer',
        'created_at' => 'datetime',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
