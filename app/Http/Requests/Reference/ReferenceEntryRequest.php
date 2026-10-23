<?php

declare(strict_types=1);

namespace App\Http\Requests\Reference;

use App\Services\ImageUploadService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ReferenceEntryRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        foreach (['values', 'product_ids'] as $field) {
            if (is_string($this->input($field))) {
                try {
                    $decoded = json_decode($this->input($field), true, flags: JSON_THROW_ON_ERROR);
                    if (is_array($decoded)) {
                        $this->merge([$field => $decoded]);
                    }
                } catch (\JsonException) {
                    // Keep malformed input so normal array validation rejects it.
                }
            }
        }
    }

    public function authorize(): bool
    {
        return $this->user()?->hasRole('owner') ?? false;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:160'],
            'description' => ['nullable', 'string', 'max:2000'],
            'schema_version' => ['required', 'integer', 'min:1'],
            'version' => [$this->route('entry') ? 'required' : 'sometimes', 'integer', 'min:1'],
            'values' => ['sometimes', 'array', 'max:20'],
            'product_ids' => ['sometimes', 'array', 'max:50'],
            'product_ids.*' => ['required', 'uuid', 'distinct', Rule::exists('products', 'id')],
            'image' => ImageUploadService::rules('nullable'),
            'remove_image' => ['sometimes', 'boolean'],
        ];
    }
}
