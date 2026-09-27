<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class OrderReturn extends Model
{
    use HasUuids;

    protected $fillable = ['request_id', 'order_id', 'order_item_id', 'user_id', 'quantity', 'amount', 'refund_method', 'refund_reference', 'restocked', 'reason'];

    protected $casts = ['quantity' => 'integer', 'amount' => 'decimal:2', 'restocked' => 'boolean'];

    public function item()
    {
        return $this->belongsTo(OrderItem::class, 'order_item_id');
    }
}
