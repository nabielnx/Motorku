<?php

namespace App\Http\Requests\Order;

use Illuminate\Foundation\Http\FormRequest;

class StoreCustomerOrderRequest extends FormRequest
{
    /**
     * Customer QR orders don't require authentication.
     */
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'customer_name' => $this->customer_name
                ? strip_tags(trim($this->customer_name))
                : $this->customer_name,
        ]);
    }

    public function rules(): array
    {
        return [
            'customer_name' => ['required', 'string', 'min:2', 'max:255'],
            'order_type' => ['required', 'in:take_away,takeaway'],
            'notes' => ['nullable', 'string', 'max:500'],

            'items' => ['required', 'array', 'min:1', 'max:20'],
            'items.*.product_id' => ['required', 'exists:products,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:200'],
            'items.*.notes' => ['nullable', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'customer_name.required' => 'Nama pemesan wajib diisi.',
            'items.required' => 'Pesanan tidak boleh kosong.',
            'items.min' => 'Minimal 1 item harus dipesan.',
            'items.max' => 'Maksimal 20 jenis item per pesanan.',
            'items.*.quantity.max' => 'Maksimal 200 porsi per item.',
            'items.*.product_id.exists' => 'Produk tidak ditemukan. Silakan refresh halaman dan coba lagi.',
        ];
    }
}
