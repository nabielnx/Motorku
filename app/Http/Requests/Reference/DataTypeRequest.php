<?php

declare(strict_types=1);

namespace App\Http\Requests\Reference;

use App\Support\BusinessRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class DataTypeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasRole('owner') ?? false;
    }

    protected function prepareForValidation(): void
    {
        if (is_string($this->name)) {
            $this->merge(['name' => trim($this->name)]);
        }
    }

    public function rules(): array
    {
        $type = $this->route('type');

        return [
            'kind' => ['required', Rule::in(['product', 'reference'])],
            'name' => ['required', 'string', 'max:80', BusinessRule::unique('data_types', 'name')->where('kind', $type?->kind ?? $this->input('kind'))->ignore($type?->id)],
            'version' => [$type ? 'required' : 'sometimes', 'integer', 'min:1'],
            'is_public' => ['sometimes', Rule::prohibitedIf(($type?->kind ?? $this->input('kind')) !== 'reference' || $type?->driver === 'motorcycles'), 'boolean'],
            'key' => ['prohibited'], 'driver' => ['prohibited'], 'is_system' => ['prohibited'],
            'fields' => ['present', 'array', 'max:20'],
            'fields.*' => ['array:key,label,type,required,options'],
            'fields.*.key' => ['required', 'string', 'regex:/\A[a-z][a-z0-9_]{0,39}\z/', 'distinct', Rule::notIn(['constructor', 'prototype'])],
            'fields.*.label' => ['required', 'string', 'max:80'],
            'fields.*.type' => ['required', Rule::in(['text', 'textarea', 'number', 'date', 'select', 'boolean'])],
            'fields.*.required' => ['required', 'boolean'],
            'fields.*.options' => ['present', 'array', 'max:30'],
            'fields.*.options.*' => ['required', 'string', 'max:100'],
        ];
    }
}
