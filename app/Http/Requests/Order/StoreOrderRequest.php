<?php

declare(strict_types=1);

namespace App\Http\Requests\Order;

use App\Support\BusinessRule;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreOrderRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user() && ($this->user()->can('order.create') || $this->user()->hasAnyRole(['owner', 'cashier']));
    }

    /**
     * Sanitize input before validation runs.
     * - Strips HTML tags and trims whitespace from customer_name (XSS guard).
     */
    protected function prepareForValidation(): void
    {
        $this->merge([
            'customer_name' => is_string($this->customer_name)
                ? strip_tags(trim($this->customer_name))
                : $this->customer_name,
        ]);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'request_id' => ['sometimes', 'uuid'],
            'expected_total' => ['sometimes', 'numeric', 'min:0', 'max:9999999999999'],
            'customer_name' => ['required', 'string', 'min:2', 'max:255'],
            'notes' => ['nullable', 'string', 'max:500'],

            'items' => ['required', 'array', 'min:1', 'max:20'],
            'items.*.product_id' => ['required', 'uuid', BusinessRule::exists('products', 'id')],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:200'],
            'items.*.notes' => ['nullable', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'customer_name.required' => 'Nama pelanggan wajib diisi.',
            'customer_name.min' => 'Nama pelanggan minimal 2 karakter.',
            'items.max' => 'Maksimal 20 jenis item per pesanan.',
            'items.*.quantity.max' => 'Maksimal 200 unit per item.',
        ];
    }
}
