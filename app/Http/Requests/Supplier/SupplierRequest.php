<?php

declare(strict_types=1);

namespace App\Http\Requests\Supplier;

use Illuminate\Foundation\Http\FormRequest;

class SupplierRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasRole('owner') ?? false;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:150'],
            'contact_person' => ['nullable', 'string', 'max:150'],
            'phone' => ['nullable', 'string', 'max:30', 'regex:/\A\+?[0-9][0-9 ()-]{2,29}\z/'],
            'email' => ['nullable', 'string', 'email:rfc', 'max:254'],
            'address' => ['nullable', 'string', 'max:1000'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'links' => ['sometimes', 'array', 'list', 'max:10'],
            'links.*' => ['required', 'array:label,url'],
            'links.*.label' => ['required', 'string', 'max:60'],
            'links.*.url' => ['required', 'string', 'max:2048', 'url:http,https'],
        ];
    }

    public function attributes(): array
    {
        return ['name' => 'nama supplier', 'contact_person' => 'nama kontak', 'phone' => 'nomor telepon', 'address' => 'alamat', 'notes' => 'catatan', 'links' => 'link toko', 'links.*.label' => 'nama platform', 'links.*.url' => 'URL toko'];
    }
}
