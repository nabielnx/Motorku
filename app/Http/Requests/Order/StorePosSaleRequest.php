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
        return [...parent::rules(), 'amount_received' => ['required', 'numeric', 'gt:0']];
    }
}
