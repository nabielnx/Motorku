<?php

declare(strict_types=1);

namespace App\Http\Requests\Setting;

use Illuminate\Foundation\Http\FormRequest;

final class ResetTransactionDataRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasRole('owner') ?? false;
    }

    public function rules(): array
    {
        return [
            'owner_password' => ['required', 'string', 'current_password:web'],
        ];
    }

    public function messages(): array
    {
        return [
            'owner_password.required' => 'Masukkan password akun owner untuk melanjutkan.',
            'owner_password.current_password' => 'Password akun owner tidak sesuai.',
        ];
    }
}
