<?php

namespace App\Http\Requests\Inventory;

use App\Enums\InventoryLogType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreInventoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() && $this->user()->hasRole('owner');
    }

    public function rules(): array
    {
        return [
            'product_id' => ['required', 'uuid', 'exists:products,id'],
            'user_id' => ['sometimes', 'nullable', 'uuid', 'exists:users,id'],
            'type' => ['required', Rule::enum(InventoryLogType::class)],
            'quantity' => ['required', 'numeric', 'gt:0'],
            'note' => ['nullable', 'string', 'max:255'],
        ];
    }
}
