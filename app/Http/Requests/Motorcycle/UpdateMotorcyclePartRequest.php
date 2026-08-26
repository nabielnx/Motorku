<?php

namespace App\Http\Requests\Motorcycle;

use App\Models\MotorcyclePart;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateMotorcyclePartRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        $validCategories = array_keys(MotorcyclePart::categoryLabels());

        return [
            'part_category'  => ['sometimes', 'required', 'string', Rule::in($validCategories)],
            'notes'          => ['nullable', 'string', 'max:255'],
            'is_recommended' => ['nullable', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'part_category.required' => 'Kategori / tipe part wajib dipilih.',
            'part_category.in'       => 'Kategori part tidak valid.',
            'notes.max'              => 'Catatan maksimal 255 karakter.',
        ];
    }
}
