<?php

declare(strict_types=1);

namespace App\Http\Requests\Reference;

use Illuminate\Foundation\Http\FormRequest;

final class PublicReferenceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return ['search' => ['nullable', 'string', 'max:100'], 'page' => ['sometimes', 'integer', 'min:1', 'max:1000000']];
    }
}
