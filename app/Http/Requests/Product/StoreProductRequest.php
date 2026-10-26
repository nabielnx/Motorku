<?php

declare(strict_types=1);

namespace App\Http\Requests\Product;

use App\Services\ImageUploadService;
use App\Support\BusinessRule;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreProductRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->can('product.create');
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'category_id' => ['required', 'uuid', BusinessRule::exists('categories', 'id')],
            'sku' => ['required', 'string', 'max:255', BusinessRule::unique('products', 'sku')],
            'name' => ['required', 'string', 'max:255'],
            'brand' => ['nullable', 'string', 'max:255'],
            'barcode' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'price' => ['required', 'numeric', 'min:0', 'max:9999999999999', 'regex:/^\d+$/'],
            'cost_price' => ['nullable', 'numeric', 'min:0', 'max:9999999999999', 'regex:/^\d+$/'],
            'stock' => ['nullable', 'integer', 'min:0', 'max:99999999'],
            'minimum_stock' => ['nullable', 'integer', 'min:0', 'max:99999999'],
            'unit' => ['nullable', 'string', 'max:50'],
            'rack_location' => ['nullable', 'string', 'max:255'],
            'image' => ImageUploadService::rules('nullable'),
            'is_available' => ['nullable', 'boolean'],
        ];
    }
}
