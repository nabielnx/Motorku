<?php

declare(strict_types=1);

namespace App\Http\Requests\Product;

use Illuminate\Foundation\Http\FormRequest;

final class BulkDeleteProductsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->hasRole('owner') && $this->user()->can('product.delete');
    }

    public function rules(): array
    {
        return ['token' => ['required', 'string', 'max:1000000']];
    }
}
