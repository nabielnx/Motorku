<?php

namespace App\Http\Requests\User;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() && $this->user()->hasRole('owner');
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'password' => ['prohibited'],
            'role' => ['required', 'string', 'in:owner,cashier'],
            'owner_password' => [Rule::requiredIf($this->input('role') === 'owner'), 'nullable', 'current_password:web'],
        ];
    }

    protected function prepareForValidation(): void
    {
        if (is_string($this->input('email'))) {
            $this->merge(['email' => strtolower(trim($this->input('email')))]);
        }
    }

    public function messages(): array
    {
        return [
            'owner_password.required' => 'Masukkan password Anda untuk memberikan akses Owner.',
            'owner_password.current_password' => 'Password akun Anda tidak sesuai.',
        ];
    }
}
