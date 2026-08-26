<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        /*
        |--------------------------------------------------------------------------
        | Owner
        |--------------------------------------------------------------------------
        */

        $owner = User::updateOrCreate(
            [
                'email' => 'owner@tokosparepart.com',
            ],
            [
                'name' => 'Owner',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ]
        );

        $owner->assignRole('owner');



        /*
        |--------------------------------------------------------------------------
        | Cashier
        |--------------------------------------------------------------------------
        */

        $cashier1 = User::updateOrCreate(
            [
                'email' => 'andi@tokosparepart.com',
            ],
            [
                'name' => 'Andi (Kasir)',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ]
        );

        $cashier1->assignRole('cashier');

        $cashier2 = User::updateOrCreate(
            [
                'email' => 'siti@tokosparepart.com',
            ],
            [
                'name' => 'Siti (Kasir)',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ]
        );

        $cashier2->assignRole('cashier');


    }
}
