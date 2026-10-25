<?php

declare(strict_types=1);

namespace App\Http\Requests\Customer;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

final class CustomerAccountRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if (is_string($this->email)) {
            $this->merge(['email' => strtolower(trim($this->email))]);
        }
    }

    public function rules(): array
    {
        return match ($this->route()->getName()) {
            'customer.register.store' => [
                'name' => ['required', 'string', 'min:2', 'max:120'],
                'email' => ['required', 'email', 'max:254', 'unique:customer_accounts,email'],
                'password' => ['required', 'string', 'max:128', 'confirmed', Password::defaults()],
            ],
            'customer.profile.update' => [
                'name' => ['required', 'string', 'min:2', 'max:120'],
                'phone' => ['nullable', 'string', 'regex:/^[0-9+\-\s()]{8,20}$/'],
                'address' => ['nullable', 'string', 'max:500'],
            ],
            'customer.password.email' => ['email' => ['required', 'email', 'max:254']],
            'customer.password.store' => [
                'token' => ['required', 'string', 'max:255'], 'email' => ['required', 'email', 'max:254'],
                'password' => ['required', 'string', 'max:128', 'confirmed', Password::defaults()],
            ],
            'customer.google.link' => ['current_password' => ['required', 'string', 'current_password:customer']],
            default => ['email' => ['required', 'email', 'max:254'], 'password' => ['required', 'string', 'max:128']],
        };
    }
}
