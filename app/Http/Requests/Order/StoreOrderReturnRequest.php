<?php

namespace App\Http\Requests\Order;

use Illuminate\Foundation\Http\FormRequest;

class StoreOrderReturnRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $this->merge([
            'refund_method' => $this->input('refund_method', 'cash'),
            'refund_confirmed' => $this->input('refund_confirmed', $this->input('cash_refunded')),
        ]);
    }

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
            'refund_method' => ['required', 'in:cash,transfer'],
            'refund_reference' => ['nullable', 'string', 'max:100'],
            'refund_confirmed' => ['accepted'],
            'reason' => ['required', 'string', 'max:255'],
        ];
    }
}
