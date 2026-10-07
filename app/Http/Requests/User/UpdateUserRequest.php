<?php

namespace App\Http\Requests\User;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() && $this->user()->hasRole('owner');
    }

    public function rules(): array
    {
        $userId = $this->route('id');
        $target = User::findOrFail($userId);
        $requiresConfirmation = ($this->input('role') === 'owner' && ! $target->hasRole('owner'))
            || $this->filled('password')
            || ($this->has('email') && $this->input('email') !== $target->email);

        return [
            'name' => 'sometimes|required|string|max:255',
            'email' => [
                'sometimes',
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique('users')->ignore($userId),
            ],
            'password' => $target->invitation_pending ? ['prohibited'] : ['nullable', Password::defaults()],
            'owner_password' => [Rule::requiredIf($requiresConfirmation), 'nullable', 'current_password:web'],
            'role' => 'sometimes|required|string|in:owner,cashier',
            'is_active' => 'sometimes|boolean',
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
            'owner_password.required' => 'Masukkan password Anda untuk mengonfirmasi perubahan akses atau email.',
            'owner_password.current_password' => 'Password akun Anda tidak sesuai.',
            'password.prohibited' => 'Penerima undangan membuat password sendiri melalui tautan aktivasi.',
        ];
    }
}
