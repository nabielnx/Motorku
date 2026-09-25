<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $hierarkiKategori = [
            'Oli, Pelumas & Kimia' => [
                'Oli Mesin (4T)',
                'Oli Samping (2T)',
                'Oli Gardan / Transmisi',
                'Oli Shockbreaker',
                'Minyak Rem',
                'Air Radiator (Coolant)',
                'Cairan Kimia & Perawatan' // Carb Cleaner, Chain Lube, Grease/Gemuk
            ],
            'Ban & Kaki-kaki' => [
                'Ban Luar Tubeless',
                'Ban Luar Biasa / Tube Type',
                'Ban Dalam',
                'Pentil & Cairan Tubeless',
                'Shockbreaker',
                'Seal Shock Depan',
                'Bearing / Laher',
                'Bushing & Karet Tromol'
            ],
            'Penggerak & CVT' => [
                'V-Belt',
                'Roller & Slider CVT',
                'Kampas Ganda & Mangkok',
                'Rumah Roller & Pulley Set',
                'Per CVT & Kampas',
                'Kampas Kopling Manual (Bebek/Sport)',
                'Gear Set & Rantai'
            ],
            'Pengereman' => [
                'Kampas Rem Cakram (Brake Pad)',
                'Kampas Rem Tromol (Brake Shoe)',
                'Piringan Cakram (Disc)',
                'Master Rem & Kaliper (Kit Seal)',
                'Kabel & Selang Rem'
            ],
            'Kelistrikan & Pengapian' => [
                'Aki / Baterai',
                'Busi',
                'Bohlam & Lampu LED',
                'Kiprok / Regulator',
                'Koil & Spul',
                'CDI / ECU',
                'Sekring (Fuse), Relay & Flasher'
            ],
            'Mesin & Bahan Bakar' => [
                'Filter Udara',
                'Filter Oli & Bensin',
                'Piston & Ring Piston',
                'Noken As, Klep & Seal Klep',
                'Rantai Keteng & Tensioner',
                'Paking / Gasket Set',
                'Karburator / Throttle Body & Injektor',
                'Fuel Pump & Dinamo Starter'
            ],
            'Kemudi, Bodi & Aksesoris' => [
                'Spion',
                'Handgrip & Jalu',
                'Kabel Gas & Kopling',
                'Baut, Mur & Klip Bodi',
                'Plastik Bodi & Kaca Lampu'
            ]
        ];

        foreach ($hierarkiKategori as $parentName => $subCategories) {
            $parent = Category::withTrashed()->where('name', $parentName)->first();
            $desc = implode(', ', $subCategories);
            if (!$parent) {
                $parent = Category::create(['name' => $parentName, 'description' => $desc]);
            } else {
                if ($parent->trashed()) {
                    $parent->restore();
                }
                $parent->update(['description' => $desc]);
            }

            foreach ($subCategories as $subCategoryName) {
                $sub = Category::withTrashed()->where('name', $subCategoryName)->first();
                if (!$sub) {
                    $sub = Category::create([
                        'name' => $subCategoryName,
                        'parent_id' => $parent->id
                    ]);
                } else {
                    if ($sub->trashed()) {
                        $sub->restore();
                    }
                    $sub->update(['parent_id' => $parent->id]);
                }
            }
        }
    }
}
