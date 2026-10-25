<?php

declare(strict_types=1);

namespace App\Http\Requests\Payment;

use App\Support\BusinessRule;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StorePaymentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'order_id' => ['required', 'uuid', BusinessRule::exists('orders', 'id')],
            'payment_method' => ['required', 'string', 'in:cash,qris_manual'],
            'amount_received' => ['required_if:payment_method,cash', 'nullable', 'numeric', 'gt:0', 'max:9999999999999'],
            'reference_number' => ['nullable', 'string', 'max:100'],
            'notes' => 'nullable|string|max:500',
        ];
    }
}
