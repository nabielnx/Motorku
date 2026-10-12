<?php

namespace App\Http\Requests\Product;

use App\Services\ProductSheetService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProductSheetRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasRole('owner')
            && $this->user()->can('product.create')
            && $this->user()->can('product.update');
    }

    public function rules(): array
    {
        return match ($this->route()->getActionMethod()) {
            'inspect' => ['file' => ['required', 'file', 'max:4096', 'extensions:xlsx,csv', 'mimes:xlsx,csv,txt']],
            'preview' => [
                'token' => ['required', 'uuid'],
                'sheets' => ['required', 'array', 'min:1', 'max:16'],
                'sheets.*.id' => ['required', 'integer', 'min:0', 'distinct'],
                'sheets.*.mapping' => ['required', 'array:'.implode(',', array_keys(ProductSheetService::FIELDS))],
                'sheets.*.mapping.*' => ['nullable', 'integer', 'min:0', 'max:39'],
                'mode' => ['required', Rule::in(['add', 'upsert', 'update'])],
                'default_group' => ['required', Rule::in(['automotive', 'bicycle', 'electronics', 'hardware'])],
                'use_estimated_cost' => ['required', 'boolean'],
            ],
            'commit' => [
                'token' => ['required', 'uuid'],
                'revision' => ['required', 'uuid'],
                'rows' => ['required', 'array', 'min:1', 'max:2000'],
                'rows.*' => ['required', 'string', 'max:30', 'distinct'],
            ],
            default => [
                'format' => ['sometimes', Rule::in(['xlsx', 'csv'])],
                'group' => ['nullable', Rule::in(['automotive', 'bicycle', 'electronics', 'hardware'])],
            ],
        };
    }
}
