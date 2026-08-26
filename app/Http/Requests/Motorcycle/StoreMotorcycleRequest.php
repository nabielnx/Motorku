<?php

namespace App\Http\Requests\Motorcycle;

use Illuminate\Foundation\Http\FormRequest;

class StoreMotorcycleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'brand'       => ['required', 'string', 'max:50'],
            'model'       => ['required', 'string', 'max:100'],
            'year_start'  => ['required', 'integer', 'min:1990', 'max:2030'],
            'year_end'    => ['nullable', 'integer', 'min:1990', 'max:2030', 'gte:year_start'],
            'engine_cc'   => ['required', 'integer', 'min:50', 'max:1500'],
            'engine_type' => ['required', 'string', 'in:matic,bebek,sport'],
            'image'       => ['nullable', 'image', 'mimes:jpeg,png,jpg,webp', 'max:3072'],
            'image_url'   => ['nullable', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'brand.required'       => 'Brand motor wajib diisi.',
            'model.required'       => 'Model motor wajib diisi.',
            'year_start.required'  => 'Tahun mulai wajib diisi.',
            'year_start.min'       => 'Tahun mulai minimal 1990.',
            'year_end.gte'         => 'Tahun akhir tidak boleh lebih kecil dari tahun mulai.',
            'engine_cc.required'   => 'Kapasitas CC mesin wajib diisi.',
            'engine_type.required' => 'Tipe mesin wajib dipilih.',
            'engine_type.in'       => 'Tipe mesin harus berupa matic, bebek, atau sport.',
            'image.image'          => 'File harus berupa gambar.',
            'image.max'            => 'Ukuran gambar maksimal 3MB.',
        ];
    }
}
