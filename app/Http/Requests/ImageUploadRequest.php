<?php

namespace App\Http\Requests;

use App\Services\ImageUploadService;
use Illuminate\Foundation\Http\FormRequest;

class ImageUploadRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        $field = match ($this->route()->getActionMethod()) {
            'uploadLogo' => 'logo',
            'uploadQrisImage' => 'qris_image',
            'uploadLoginImage' => 'login_image',
            'uploadPromoBanner' => 'banner',
            default => 'avatar',
        };

        return [$field => ImageUploadService::rules(), ...($field === 'banner' ? ['slot' => ['required', 'integer', 'between:1,3']] : [])];
    }

    public function messages(): array
    {
        return [
            '*.image' => 'File harus berupa gambar yang valid.',
            '*.mimes' => 'Gunakan format JPEG, PNG, atau WebP.',
            '*.max' => 'Ukuran gambar masukan maksimal 4 MB.',
            '*.dimensions' => 'Dimensi gambar maksimal 6000 × 6000 piksel (maksimal 16 megapiksel).',
        ];
    }
}
