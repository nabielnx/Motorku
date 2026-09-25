<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

class SettingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $settings = [

            /*
            |--------------------------------------------------------------------------
            | Store
            |--------------------------------------------------------------------------
            */

            [
                'group' => 'store',
                'key' => 'name',
                'value' => 'Motorku',
                'type' => 'string',
            ],

            [
                'group' => 'store',
                'key' => 'logo',
                'value' => 'logo/KhjIclRcD4NNnH44nvMkhrGhEuhPyTpREqSfOTSQ.png',
                'type' => 'string',
            ],

            [
                'group' => 'store',
                'key' => 'phone',
                'value' => '081234567890',
                'type' => 'string',
            ],

            [
                'group' => 'store',
                'key' => 'email',
                'value' => 'info@tokosparepart.com',
                'type' => 'string',
            ],

            [
                'group' => 'store',
                'key' => 'address',
                'value' => 'Jl. Contoh No. 1',
                'type' => 'string',
            ],

            /*
            |--------------------------------------------------------------------------
            | Tax
            |--------------------------------------------------------------------------
            */

            [
                'group' => 'tax',
                'key' => 'percentage',
                'value' => '10',
                'type' => 'integer',
            ],

            [
                'group' => 'tax',
                'key' => 'enabled',
                'value' => 'true',
                'type' => 'boolean',
            ],

            /*
            |--------------------------------------------------------------------------
            | Payment
            |--------------------------------------------------------------------------
            */

            [
                'group' => 'payment',
                'key' => 'cash_enabled',
                'value' => 'true',
                'type' => 'boolean',
            ],

            [
                'group' => 'payment',
                'key' => 'qris_enabled',
                'value' => 'false',
                'type' => 'boolean',
            ],

            [
                'group' => 'payment',
                'key' => 'card_enabled',
                'value' => 'false',
                'type' => 'boolean',
            ],

            /*
            |--------------------------------------------------------------------------
            | Printer
            |--------------------------------------------------------------------------
            */

            [
                'group' => 'printer',
                'key' => 'paper_size',
                'value' => '80',
                'type' => 'integer',
            ],

            [
                'group' => 'printer',
                'key' => 'auto_print_receipt',
                'value' => 'true',
                'type' => 'boolean',
            ],



            /*
            |--------------------------------------------------------------------------
            | QR Ordering
            |--------------------------------------------------------------------------
            */

            [
                'group' => 'qr_order',
                'key' => 'enabled',
                'value' => 'true',
                'type' => 'boolean',
            ],

            [
                'group' => 'qr_order',
                'key' => 'session_timeout',
                'value' => '120',
                'type' => 'integer',
            ],

            /*
            |--------------------------------------------------------------------------
            | Catalog Settings
            |--------------------------------------------------------------------------
            */

            [
                'group' => 'catalog',
                'key' => 'show_total_sold',
                'value' => 'true',
                'type' => 'boolean',
            ],

            /*
            |--------------------------------------------------------------------------
            | Store
            |--------------------------------------------------------------------------
            */

            [
                'group' => 'store',
                'key' => 'open_time',
                'value' => '10:00',
                'type' => 'string',
            ],

            [
                'group' => 'store',
                'key' => 'close_time',
                'value' => '22:00',
                'type' => 'string',
            ],

            /*
            |--------------------------------------------------------------------------
            | System
            |--------------------------------------------------------------------------
            */

            [
                'group' => 'system',
                'key' => 'timezone',
                'value' => 'Asia/Jakarta',
                'type' => 'string',
            ],

            [
                'group' => 'system',
                'key' => 'locale',
                'value' => 'id',
                'type' => 'string',
            ],

            [
                'group' => 'system',
                'key' => 'currency_symbol',
                'value' => 'Rp',
                'type' => 'string',
            ],

        ];

        foreach ($settings as $setting) {

            Setting::updateOrCreate(
                [
                    'group' => $setting['group'],
                    'key' => $setting['key'],
                ],
                [
                    'value' => $setting['value'],
                    'type' => $setting['type'],
                ]
            );

        }
    }
}
