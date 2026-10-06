<?php

namespace App\Http\Requests\Category;

use App\Models\Category;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCategoryRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->can('category.update');
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $id = $this->route('id');

        return [
            'catalog_group' => ['sometimes', Rule::in(array_keys(Category::CATALOG_GROUPS))],
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('categories', 'name')->ignore($id),
            ],
            'description' => ['nullable', 'string'],
            'sub_categories' => ['nullable', 'array'],
            'sub_categories.*.id' => ['nullable', 'uuid', 'distinct', Rule::exists('categories', 'id')->where('parent_id', $id)],
            'sub_categories.*.name' => Rule::forEach(fn ($value, $attribute) => [
                'required', 'string', 'max:255',
                Rule::unique('categories', 'name')->ignore($this->input(str_replace('.name', '.id', $attribute))),
                function ($attribute, $value, $fail) {
                    if (! is_string($value) || ! is_string($this->input('name'))) {
                        return;
                    }
                    $names = collect($this->input('sub_categories', []))->pluck('name')->filter(fn ($name) => is_string($name))->map(fn ($name) => mb_strtolower(trim($name)));
                    if ($names->filter(fn ($name) => $name === mb_strtolower(trim($value)))->count() > 1 || strcasecmp(trim($value), trim($this->input('name'))) === 0) {
                        $fail('Nama kategori tidak boleh sama.');
                    }
                },
            ]),
        ];
    }
}
