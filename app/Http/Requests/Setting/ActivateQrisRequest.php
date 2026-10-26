<?php

declare(strict_types=1);

namespace App\Http\Requests\Setting;

use Illuminate\Foundation\Http\FormRequest;

class ActivateQrisRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasRole('owner') ?? false;
    }

    public function rules(): array
    {
        return ['qris_payload' => ['required', 'string', 'max:2048'], 'image_revision' => ['required', 'string', 'regex:/\A[a-f0-9]{64}\z/']];
    }
}
