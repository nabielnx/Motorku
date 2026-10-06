<?php

namespace App\Http\Requests\Setting;

use App\Models\Setting;
use Illuminate\Foundation\Http\FormRequest;

class UpdateSettingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() && $this->user()->hasRole('owner');
    }

    public function rules(): array
    {
        $setting = Setting::findOrFail($this->route('id'));
        $key = $setting->group.'.'.$setting->key;
        abort_unless(isset(SaveSettingsRequest::VALUE_RULES[$key]), 422, 'Gunakan endpoint upload untuk pengaturan gambar. Pengaturan lain yang tidak dikenal ditolak.');

        return [
            'value' => SaveSettingsRequest::VALUE_RULES[$key],
        ];
    }
}
