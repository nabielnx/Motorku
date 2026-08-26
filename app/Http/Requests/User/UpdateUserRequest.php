<?php

namespace App\Http\Requests\User;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() && $this->user()->hasRole('owner');
    }

    public function rules(): array
    {
        $userId = $this->route('id');

        return [
            'name'     => 'sometimes|required|string|max:255',
            'email'    => [
                'sometimes',
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique('users')->ignore($userId),
            ],
            'password' => 'nullable|string|min:8',
            'role'     => 'sometimes|required|string|in:owner,cashier',
            'is_active' => 'sometimes|boolean',
        ];
    }
}
