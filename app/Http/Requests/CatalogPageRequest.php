<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class CatalogPageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Public fields only; the POS route additionally requires staff role.
    }

    public function rules(): array
    {
        return [
            'page' => ['sometimes', 'integer', 'min:1', 'max:1000000'],
            'search' => ['nullable', 'string', 'max:160'],
            'category' => ['nullable', 'string', 'max:255'],
            'ids' => ['sometimes', 'array', 'max:20'],
            'ids.*' => ['uuid'],
        ];
    }
}
