<?php

namespace App\Http\Requests\Motorcycle;

use App\Models\MotorcyclePart;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AttachMotorcyclePartRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        $validCategories = array_keys(MotorcyclePart::categoryLabels());

        return [
            'product_id'     => ['required', 'uuid', 'exists:products,id'],
            'part_category'  => ['required', 'string', Rule::in($validCategories)],
            'notes'          => ['nullable', 'string', 'max:255'],
            'is_recommended' => ['nullable', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'product_id.required'    => 'Produk sparepart wajib dipilih.',
            'product_id.exists'      => 'Produk sparepart tidak valid atau tidak ditemukan.',
            'part_category.required' => 'Kategori / tipe part wajib dipilih.',
            'part_category.in'       => 'Kategori part tidak valid.',
            'notes.max'              => 'Catatan maksimal 255 karakter.',
        ];
    }
}
