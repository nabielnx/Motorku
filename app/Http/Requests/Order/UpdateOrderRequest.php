<?php

namespace App\Http\Requests\Order;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateOrderRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user() && (
            $this->user()->can('order.update') ||
            $this->user()->hasAnyRole(['owner', 'cashier'])
        );
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('status') && ! $this->has('order_status')) {
            $status = $this->input('status');
            $status = $status === 'processing' ? 'preparing' : $status;
            $this->merge([
                'order_status' => $status,
            ]);
        }
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'status' => ['nullable', 'in:pending,preparing,ready,completed,cancelled'],
            'order_status' => ['nullable', 'in:pending,preparing,ready,completed,cancelled'],
        ];
    }
}
