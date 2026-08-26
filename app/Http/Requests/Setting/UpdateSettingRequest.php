<?php

namespace App\Http\Requests\Setting;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSettingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() && $this->user()->hasRole('owner');
    }

    public function rules(): array
    {
        return [
            'value' => ['nullable', 'string'],
        ];
    }
}
