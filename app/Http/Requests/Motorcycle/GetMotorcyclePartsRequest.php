<?php

namespace App\Http\Requests\Motorcycle;

use Illuminate\Foundation\Http\FormRequest;

class GetMotorcyclePartsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'search'         => ['nullable', 'string', 'max:100'],
            'part_category'  => ['nullable', 'string', 'max:50'],
            'category'       => ['nullable', 'string', 'max:50'],
            'group'          => ['nullable', 'string', 'max:50'],
            'is_recommended' => ['nullable'],
            'per_page'       => ['nullable', 'integer', 'min:1', 'max:100'],
            'page'           => ['nullable', 'integer', 'min:1'],
            'all'            => ['nullable'],
        ];
    }
}
