<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $paymentMethod = null;
        if ($this->relationLoaded('payments')) {
            $paymentMethod = $this->payments->firstWhere('status', 'paid')?->payment_method
                ?? $this->payments->first()?->payment_method;
        } elseif (method_exists($this->resource, 'latestPayment') && $this->latestPayment) {
            $paymentMethod = $this->latestPayment->payment_method;
        }

        return [
            'id' => $this->id,
            'order_number' => $this->order_number,
            'customer_name' => $this->customer_name,
            'customer_token' => $this->customer_access_token,
            'subtotal' => (float) $this->subtotal,
            'discount_amount' => (float) $this->discount_amount,
            'tax_amount' => (float) $this->tax_amount,
            'total' => (float) $this->total,
            'order_status' => $this->order_status instanceof \BackedEnum ? $this->order_status->value : $this->order_status,
            'payment_status' => $this->payment_status instanceof \BackedEnum ? $this->payment_status->value : $this->payment_status,
            'payment_method' => $paymentMethod ?? 'cash',
            'cashier' => new UserResource($this->whenLoaded('cashier')),
            'items' => OrderItemResource::collection($this->whenLoaded('items')),
            'returns' => $this->whenLoaded('returns', fn () => $this->returns->map(fn ($return) => [
                'id' => $return->id,
                'order_item_id' => $return->order_item_id,
                'product_name' => $return->item?->product_name,
                'quantity' => $return->quantity,
                'amount' => (float) $return->amount,
                'restocked' => $return->restocked,
                'reason' => $return->reason,
                'created_at' => $return->created_at?->toIso8601String(),
            ])),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
