<?php

declare(strict_types=1);

namespace App\Http\Requests\Supplier;

use Illuminate\Foundation\Http\FormRequest;

class SupplierIndexRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasRole('owner') ?? false;
    }

    public function rules(): array
    {
        return ['search' => ['nullable', 'string', 'max:100'], 'page' => ['sometimes', 'integer', 'min:1', 'max:1000000']];
    }
}
