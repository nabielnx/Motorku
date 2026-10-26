<?php

declare(strict_types=1);

namespace App\Http\Requests\Order;

use App\Support\BusinessRule;
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
            'customer_name' => is_string($this->customer_name)
                ? strip_tags(trim($this->customer_name))
                : $this->customer_name,
        ]);
    }

    public function rules(): array
    {
        return [
            'request_id' => ['sometimes', 'uuid'],
            'customer_name' => ['required', 'string', 'min:2', 'max:255'],
            'customer_phone' => ['nullable', 'string', 'regex:/^[0-9+\-\s()]{8,20}$/'],
            'notes' => ['nullable', 'string', 'max:500'],
            'payment_preference' => ['sometimes', 'in:kasir,qris'],
            'expected_total' => ['sometimes', 'numeric', 'min:0', 'max:9999999999999'],

            'items' => ['required', 'array', 'min:1', 'max:20'],
            'items.*.product_id' => ['required', 'uuid', BusinessRule::exists('products', 'id')],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:'.config('order.public_max_quantity_per_item', 10)],
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
            'items.*.quantity.max' => 'Jumlah per barang melebihi batas pesanan online.',
            'items.*.product_id.exists' => 'Produk tidak ditemukan. Silakan refresh halaman dan coba lagi.',
        ];
    }
}
