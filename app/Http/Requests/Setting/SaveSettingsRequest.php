<?php

namespace App\Http\Requests\Setting;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class SaveSettingsRequest extends FormRequest
{
    public const VALUE_RULES = [
        'store.tagline' => ['nullable', 'string', 'max:120'],
        'store.name' => ['required', 'string', 'max:100'],
        'store.phone' => ['required', 'string', 'regex:/^[0-9+\-\s()]{8,20}$/'],
        'store.email' => ['required', 'email', 'max:100'],
        'store.address' => ['required', 'string', 'max:500'],
        'store.open_time' => ['required', 'date_format:H:i'],
        'store.close_time' => ['required', 'date_format:H:i'],
        'tax.enabled' => ['required', 'in:true,false'],
        'tax.percentage' => ['required', 'numeric', 'min:0', 'max:100'],
        'payment.cash_enabled' => ['required', 'in:true,false'],
        'payment.qris_enabled' => ['required', 'in:true,false'],
        'payment.card_enabled' => ['required', 'in:true,false'],
        'printer.paper_size' => ['required', 'integer', 'in:58,80'],
        'printer.auto_print_receipt' => ['required', 'in:true,false'],
        'qr_order.enabled' => ['required', 'in:true,false'],
        'qr_order.session_timeout' => ['required', 'integer', 'min:1', 'max:1440'],
        'catalog.show_total_sold' => ['required', 'in:true,false'],
        'promo_banner.enabled' => ['required', 'in:true,false'],
        'system.timezone' => ['required', 'in:Asia/Jakarta,Asia/Makassar,Asia/Jayapura'],
        'system.locale' => ['required', 'in:id,en'],
    ];

    public function authorize(): bool
    {
        return $this->user()?->hasRole('owner') ?? false;
    }

    public function rules(): array
    {
        $rules = [
            'settings' => ['required', 'array', 'min:1', 'max:30'],
            'settings.*' => ['array:group,key,value'],
            'settings.*.group' => ['required', 'string'],
            'settings.*.key' => ['required', 'string'],
        ];
        foreach ((array) $this->input('settings', []) as $index => $item) {
            $key = $this->settingKey($item);
            $rules["settings.$index.value"] = self::VALUE_RULES[$key] ?? ['nullable'];
        }

        return $rules;
    }

    public function after(): array
    {
        return [function (Validator $validator) {
            $seen = [];
            foreach ((array) $this->input('settings', []) as $index => $item) {
                $key = $this->settingKey($item);
                if (! isset(self::VALUE_RULES[$key]) || isset($seen[$key])) {
                    $validator->errors()->add("settings.$index.key", 'Pengaturan tidak dikenal atau dikirim lebih dari sekali.');
                }
                $seen[$key] = true;
            }
        }];
    }

    private function settingKey(mixed $item): string
    {
        return is_array($item) && is_string($item['group'] ?? null) && is_string($item['key'] ?? null)
            ? $item['group'].'.'.$item['key'] : '';
    }
}
