<?php

declare(strict_types=1);

namespace App\Http\Requests\Reference;

use Illuminate\Foundation\Http\FormRequest;

class ReferenceQueryRequest extends FormRequest
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
