<?php

namespace App\Http\Requests\Order;

class StorePosSaleRequest extends StoreOrderRequest
{
    protected function prepareForValidation(): void
    {
        parent::prepareForValidation();

        if (blank($this->input('customer_name'))) {
            $this->merge(['customer_name' => 'Pelanggan Umum']);
        }
    }

    public function rules(): array
    {
        return [
            ...parent::rules(),
            'payment_method' => ['sometimes', 'in:cash,qris_manual'],
            'amount_received' => ['required_unless:payment_method,qris_manual', 'nullable', 'numeric', 'gt:0'],
            'reference_number' => ['nullable', 'string', 'max:100'],
        ];
    }
}
