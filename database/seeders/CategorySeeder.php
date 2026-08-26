<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            [
                'name' => 'Ban & Velg',
                'description' => 'Ban luar, ban dalam, dan velg untuk motor',
            ],
            [
                'name' => 'Aki & Kelistrikan',
                'description' => 'Aki, busi, koil, lampu, kiprok, dan komponen kelistrikan',
            ],
            [
                'name' => 'Oli & Pelumas',
                'description' => 'Oli mesin, oli gardan, minyak rem, coolant, dan pelumas lainnya',
            ],
            [
                'name' => 'Filter & Konsumsi',
                'description' => 'Filter udara, filter oli, coolant, injector cleaner',
            ],
            [
                'name' => 'Rem & Kaki-kaki',
                'description' => 'Kampas rem, master rem, piringan cakram, shockbreaker, dan komponen kaki-kaki',
            ],
            [
                'name' => 'Penggerak & CVT',
                'description' => 'V-Belt, roller, kampas ganda, per CVT, gear set, rantai, kampas kopling',
            ],
            [
                'name' => 'Aksesoris',
                'description' => 'Spion, handgrip, klakson, handle, kabel gas, jok, dan aksesoris lainnya',
            ],
        ];

        foreach ($categories as $category) {
            Category::updateOrCreate(
                ['name' => $category['name']],
                $category
            );
        }
    }
}
