<?php

declare(strict_types=1);

namespace App\Http\Requests\Product;

use App\Models\Category;
use App\Services\ProductService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class PreviewBulkDeleteProductsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->hasRole('owner') && $this->user()->can('product.delete');
    }

    public function rules(): array
    {
        return [
            'mode' => ['required', Rule::in(['ids', 'filtered'])],
            'ids' => ['required_if:mode,ids', 'prohibited_unless:mode,ids', 'array', 'min:1', 'max:'.ProductService::MAX_BULK_DELETE],
            'ids.*' => ['required', 'uuid', 'distinct:ignore_case'],
            'excluded_ids' => ['sometimes', 'prohibited_unless:mode,filtered', 'array', 'max:'.ProductService::MAX_BULK_DELETE],
            'excluded_ids.*' => ['required', 'uuid', 'distinct:ignore_case'],
            'filters' => ['present_if:mode,filtered', 'array:group,search,category,stock_status,availability'],
            'filters.group' => ['nullable', 'string', Rule::in(array_keys(Category::catalogGroups()))],
            'filters.search' => ['nullable', 'string', 'max:200'],
            'filters.category' => ['nullable', 'string', 'max:255'],
            'filters.stock_status' => ['nullable', Rule::in(['all', 'low', 'out', 'normal'])],
            'filters.availability' => ['nullable', Rule::in(['all', 'active', 'inactive'])],
        ];
    }
}
