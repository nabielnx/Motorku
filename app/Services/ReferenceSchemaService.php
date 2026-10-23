<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class ReferenceSchemaService
{
    public function validate(array $fields, array $values): array
    {
        $keys = array_column($fields, 'key');
        $rules = ['values' => ['array', $keys ? 'array:'.implode(',', $keys) : 'max:0']];
        $labels = [];
        foreach ($fields as $field) {
            $key = 'values.'.$field['key'];
            $rules[$key] = [$field['required'] ? 'required' : 'nullable', ...match ($field['type']) {
                'number' => ['numeric', 'between:-1000000000000,1000000000000'],
                'boolean' => ['boolean'],
                'date' => ['date_format:Y-m-d'],
                'select' => ['string', Rule::in($field['options'])],
                'textarea' => ['string', 'max:2000'],
                default => ['string', 'max:255'],
            }];
            $labels[$key] = $field['label'];
        }
        $validated = Validator::make(['values' => $values], $rules, [], $labels)->validate()['values'];
        foreach ($fields as $field) {
            $key = $field['key'];
            if (isset($validated[$key])) {
                $validated[$key] = match ($field['type']) {
                    'boolean' => (bool) $validated[$key],
                    'number' => (float) $validated[$key],
                    default => $validated[$key],
                };
            }
        }

        return $validated;
    }
}
