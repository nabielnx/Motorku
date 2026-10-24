<?php

declare(strict_types=1);

namespace App\Http\Requests\Setting;

use App\Http\Requests\ImageUploadRequest;

class UploadQrisRequest extends ImageUploadRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasRole('owner') ?? false;
    }

    public function rules(): array
    {
        return [...parent::rules(), 'qris_payload' => ['nullable', 'string', 'max:2048']];
    }
}
