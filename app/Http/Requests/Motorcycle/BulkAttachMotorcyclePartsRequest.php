<?php

namespace App\Http\Requests\Motorcycle;

use App\Models\MotorcyclePart;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class BulkAttachMotorcyclePartsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        $validCategories = array_keys(MotorcyclePart::categoryLabels());

        return [
            'motorcycle_ids'   => ['required', 'array', 'min:1'],
            'motorcycle_ids.*' => ['required', 'uuid', 'exists:motorcycles,id'],
            'product_ids'      => ['required', 'array', 'min:1'],
            'product_ids.*'    => ['required', 'uuid', 'exists:products,id'],
            'part_category'    => ['required', 'string', Rule::in($validCategories)],
            'notes'            => ['nullable', 'string', 'max:255'],
            'is_recommended'   => ['nullable', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'motorcycle_ids.required' => 'Minimal pilih 1 model motor.',
            'motorcycle_ids.min'      => 'Minimal pilih 1 model motor.',
            'motorcycle_ids.*.exists' => 'Salah satu motor yang dipilih tidak ditemukan.',
            'product_ids.required'    => 'Minimal pilih 1 produk sparepart.',
            'product_ids.min'         => 'Minimal pilih 1 produk sparepart.',
            'product_ids.*.exists'    => 'Salah satu sparepart yang dipilih tidak ditemukan.',
            'part_category.required'  => 'Kategori / tipe part wajib dipilih.',
            'part_category.in'        => 'Kategori part tidak valid.',
            'notes.max'               => 'Catatan maksimal 255 karakter.',
        ];
    }
}
