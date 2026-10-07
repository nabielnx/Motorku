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
        if (! app()->environment(['local', 'testing'])) {
            $this->call([RoleSeeder::class, SettingSeeder::class]);

            return;
        }
        $this->call([
            RoleSeeder::class,
            UserSeeder::class,
            CategorySeeder::class,
            // ProductSeeder::class, // Diganti dengan seeder per-part
            OilProductSeeder::class,
            TireProductSeeder::class,
            MotorcycleSeeder::class,
            MotorcyclePartSeeder::class,
            TireMotorcycleMappingSeeder::class,
            SettingSeeder::class,
            // DemoOrderSeeder::class, // Disabled for clean testing environment
        ]);
    }
}
