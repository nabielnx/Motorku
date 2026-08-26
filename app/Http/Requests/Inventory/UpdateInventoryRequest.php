<?php

namespace App\Http\Requests\Inventory;

use App\Enums\InventoryLogType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateInventoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() && $this->user()->hasRole('owner');
    }

    public function rules(): array
    {
        return [
            'product_id' => 'sometimes|required|uuid|exists:products,id',
            'user_id'    => 'nullable|uuid|exists:users,id',
            'type'       => ['sometimes', 'required', Rule::enum(InventoryLogType::class)],
            'quantity'   => 'sometimes|required|numeric|min:0',
            'note'       => 'nullable|string',
        ];
    }
}
