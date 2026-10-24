<?php

declare(strict_types=1);

namespace App\Http\Requests\Inventory;

use App\Enums\InventoryLogType;
use App\Support\BusinessRule;
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
            'product_id' => ['sometimes', 'required', 'uuid', BusinessRule::exists('products')],
            'user_id' => ['nullable', 'uuid', BusinessRule::exists('users')],
            'type' => ['sometimes', 'required', Rule::enum(InventoryLogType::class)],
            'quantity' => 'sometimes|required|numeric|min:0',
            'note' => 'nullable|string',
        ];
    }
}
