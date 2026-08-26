<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            RoleSeeder::class,
            UserSeeder::class,
            CategorySeeder::class,
            ProductSeeder::class,
            MotorcycleSeeder::class,
            MotorcyclePartSeeder::class,
            SettingSeeder::class,
            // DemoOrderSeeder::class, // Disabled for clean testing environment
        ]);
    }
}
