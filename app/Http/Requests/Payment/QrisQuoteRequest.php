<?php

declare(strict_types=1);

namespace App\Http\Requests\Payment;

use App\Support\BusinessRule;
use Illuminate\Foundation\Http\FormRequest;

class QrisQuoteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasAnyRole(['owner', 'cashier']) ?? false;
    }

    public function rules(): array
    {
        return [
            'items' => ['required', 'array', 'min:1', 'max:20'],
            'items.*.product_id' => ['required', 'uuid', BusinessRule::exists('products', 'id')],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:200'],
            'expected_amount' => ['required', 'numeric', 'gt:0', 'max:10000000'],
        ];
    }
}
