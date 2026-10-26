<?php

declare(strict_types=1);

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class RegisterBusinessRequest extends FormRequest
{
    public function authorize(): bool
    {
        return ! $this->user();
    }

    protected function prepareForValidation(): void
    {
        foreach (['name', 'business_name', 'business_slug', 'email'] as $key) {
            if (is_string($this->input($key))) {
                $value = trim($this->input($key));
                $this->merge([$key => in_array($key, ['email', 'business_slug'], true) ? strtolower($value) : $value]);
            }
        }
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'string', 'email', 'max:254', Rule::unique('users', 'email')],
            'business_name' => ['required', 'string', 'max:100'],
            'business_slug' => ['required', 'string', 'min:3', 'max:80', 'regex:/\A[a-z0-9]+(?:-[a-z0-9]+)*\z/', Rule::unique('businesses', 'slug')],
            'password' => ['required', 'string', 'max:128', 'confirmed', Password::defaults()],
            'business_id' => ['prohibited'], 'role' => ['prohibited'], 'email_verified_at' => ['prohibited'],
        ];
    }

    public function attributes(): array
    {
        return ['business_name' => 'nama usaha', 'business_slug' => 'alamat toko', 'name' => 'nama owner'];
    }
}
