<?php

namespace App\Http\Requests\Order;

use Illuminate\Foundation\Http\FormRequest;

class StoreOrderReturnRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasRole('owner') ?? false;
    }

    public function rules(): array
    {
        return [
            'request_id' => ['required', 'uuid'],
            'order_item_id' => ['required', 'uuid', 'exists:order_items,id'],
            'quantity' => ['required', 'integer', 'min:1'],
            'restock' => ['required', 'boolean'],
            'cash_refunded' => ['accepted'],
            'reason' => ['required', 'string', 'max:255'],
        ];
    }
}
