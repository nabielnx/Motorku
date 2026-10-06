<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class OilProductSeeder extends Seeder
{
    public function run(): void
    {
        $data = [
            0 => [
                'brand' => 'Pertamina',
                'name' => 'Meditran S (5 L)',
                'price' => 290000,
            ],
            1 => [
                'brand' => 'Pertamina',
                'name' => 'Meditran S (1 L)',
                'price' => 65000,
            ],
            2 => [
                'brand' => 'Pertamina',
                'name' => 'Mesran Super Motor (0.8L)',
                'price' => 53000,
            ],
            3 => [
                'brand' => 'Pertamina',
                'name' => 'Mesran Super (0.8L)',
                'price' => 55000,
            ],
            4 => [
                'brand' => 'Pertamina',
                'name' => 'Mesran Super (1 L)',
                'price' => 63000,
            ],
            5 => [
                'brand' => 'Pertamina',
                'name' => 'Mesran Super (4 L)',
                'price' => 245000,
            ],
            6 => [
                'brand' => 'Pertamina',
                'name' => 'Mesran B40 (1 L)',
                'price' => 65000,
            ],
            7 => [
                'brand' => 'Pertamina',
                'name' => 'Mesran B40 (4 L)',
                'price' => 245000,
            ],
            8 => [
                'brand' => 'Pertamina',
                'name' => 'Mesran B40 (5 L)',
                'price' => 300000,
            ],
            9 => [
                'brand' => 'Pertamina',
                'name' => 'Mesran SAE 40',
                'price' => 62000,
            ],
            10 => [
                'brand' => 'Pertamina',
                'name' => 'Mesran 2T OB (0.8L)',
                'price' => 62000,
            ],
            11 => [
                'brand' => 'Pertamina',
                'name' => 'Prima XP (1 L)',
                'price' => 67000,
            ],
            12 => [
                'brand' => 'Pertamina',
                'name' => 'Prima XP (4 L)',
                'price' => 260000,
            ],
            13 => [
                'brand' => 'Pertamina',
                'name' => 'Enduro 4T (0.8L)',
                'price' => 59000,
            ],
            14 => [
                'brand' => 'Pertamina',
                'name' => 'Enduro Matic (0.8L)',
                'price' => 65000,
            ],
            15 => [
                'brand' => 'Pertamina',
                'name' => 'Enduro Racing (1 L)',
                'price' => 83000,
            ],
            16 => [
                'brand' => 'Yamalube',
                'name' => 'Yamalube XP (0.8L)',
                'price' => 59000,
            ],
            17 => [
                'brand' => 'Yamalube',
                'name' => 'Yamalube Sliver (0.8L)',
                'price' => 64000,
            ],
            18 => [
                'brand' => 'Yamalube',
                'name' => 'Yamalube Matic (0.8L)',
                'price' => 64000,
            ],
            19 => [
                'brand' => 'Yamalube',
                'name' => 'Yamalube Sport (1 L)',
                'price' => 77000,
            ],
            20 => [
                'brand' => 'Yamalube',
                'name' => 'Yamalube Super Matic (1 L)',
                'price' => 92000,
            ],
            21 => [
                'brand' => 'Federal Oil',
                'name' => 'Federal Matic (0.65L)',
                'price' => 56000,
            ],
            22 => [
                'brand' => 'Federal Oil',
                'name' => 'Federal Ultratec (0.8L)',
                'price' => 65000,
            ],
            23 => [
                'brand' => 'Federal Oil',
                'name' => 'Federal Ultratec (1 L)',
                'price' => 75000,
            ],
            24 => [
                'brand' => 'Federal Oil',
                'name' => 'Federal Matic Silver (0.8L)',
                'price' => 67000,
            ],
            25 => [
                'brand' => 'Federal Oil',
                'name' => 'Federal Matic Orange (0.8L)',
                'price' => 62000,
            ],
            26 => [
                'brand' => 'Shell',
                'name' => 'Shell Helix (1 L)',
                'price' => 95000,
            ],
            27 => [
                'brand' => 'Shell',
                'name' => 'Shell Advance AX5 (0.8L)',
                'price' => 62000,
            ],
            28 => [
                'brand' => 'Shell',
                'name' => 'Shell Advance AX5 (1 L)',
                'price' => 74000,
            ],
            29 => [
                'brand' => 'Shell',
                'name' => 'Shell Advance 2T (0.8L)',
                'price' => 58000,
            ],
            30 => [
                'brand' => 'Shell',
                'name' => 'Shell Advance AX5 Matic (0.8L)',
                'price' => 62000,
            ],
            31 => [
                'brand' => 'Shell',
                'name' => 'Shell Advance AX7 Matic (0.8L)',
                'price' => 70000,
            ],
            32 => [
                'brand' => 'Shell',
                'name' => 'Shell Advance AX7 (0.8L)',
                'price' => 70000,
            ],
            33 => [
                'brand' => 'Shell',
                'name' => 'Shell Advance AX7 (1 L)',
                'price' => 80000,
            ],
            34 => [
                'brand' => 'Shell',
                'name' => 'Shell Advance AX7 Matic (1 L)',
                'price' => 85000,
            ],
            35 => [
                'brand' => 'Shell',
                'name' => 'Shell Advance AX7 (0.65L)',
                'price' => 60000,
            ],
            36 => [
                'brand' => 'Evalube',
                'name' => 'Evalube 2T (0.8L)',
                'price' => 42000,
            ],
            37 => [
                'brand' => 'Evalube',
                'name' => 'Evalube 4T (0.8L)',
                'price' => 49000,
            ],
            38 => [
                'brand' => 'Evalube',
                'name' => 'Evalube Pro 2T',
                'price' => 52000,
            ],
            39 => [
                'brand' => 'Evalube',
                'name' => 'Evalube Matic (0.8L)',
                'price' => 54000,
            ],
            40 => [
                'brand' => 'Castrol',
                'name' => 'Castrol Active 2T',
                'price' => 65000,
            ],
            41 => [
                'brand' => 'Castrol',
                'name' => 'Castrol Go 4T',
                'price' => 62000,
            ],
            42 => [
                'brand' => 'Honda AHM',
                'name' => 'AHM MPX 1 (0.8L)',
                'price' => 80000,
            ],
            43 => [
                'brand' => 'Honda AHM',
                'name' => 'AHM MPX 1 (1 L)',
                'price' => 91000,
            ],
            44 => [
                'brand' => 'Honda AHM',
                'name' => 'AHM MPX 1 (1.2 L)',
                'price' => 102000,
            ],
            45 => [
                'brand' => 'Honda AHM',
                'name' => 'AHM MPX 2 (0.8 L)',
                'price' => 82000,
            ],
            46 => [
                'brand' => 'Honda AHM',
                'name' => 'AHM MPX 2 (0.65 L)',
                'price' => 70000,
            ],
            47 => [
                'brand' => 'Honda AHM',
                'name' => 'AHM MPX 3 (0.8L)',
                'price' => 82000,
            ],
            48 => [
                'brand' => 'Honda AHM',
                'name' => 'AHM SPX 2 (0.8 L)',
                'price' => 95000,
            ],
            49 => [
                'brand' => 'Idemitsu',
                'name' => 'Idemitsu 2T (0.8L)',
                'price' => 80000,
            ],
            50 => [
                'brand' => 'Deltalube',
                'name' => 'Deltalube Daily / (0.8L)',
                'price' => 115000,
            ],
            51 => [
                'brand' => 'Deltalube',
                'name' => 'Deltalube Matic (0.8L)',
                'price' => 115000,
            ],
            52 => [
                'brand' => 'Deltalube',
                'name' => 'Deltalube Adventure (1L)',
                'price' => 145000,
            ],
            53 => [
                'brand' => 'Motul',
                'name' => 'Motul 2T',
                'price' => 155000,
            ],
            54 => [
                'brand' => 'Motul',
                'name' => 'Motul Scooter LE Matic',
                'price' => 85000,
            ],
            55 => [
                'brand' => 'Oli Gardan Yamalube',
                'name' => 'Oli Gardan Yamalube (100 ml)',
                'price' => 21000,
            ],
            56 => [
                'brand' => 'Oli Gardan Yamalube',
                'name' => 'Oli Gardan Yamalube (140 ml)',
                'price' => 25000,
            ],
            57 => [
                'brand' => 'Oli Gardan Yamalube',
                'name' => 'Oli Gardan Yamalube (150 ml)',
                'price' => 26000,
            ],
            58 => [
                'brand' => 'Oli Gardan HONDA AHM',
                'name' => 'Oli Gardan AHM (120ML)',
                'price' => 22000,
            ],
        ];

        foreach ($data as $item) {
            $categoryName = 'Oli Mesin (4T)';
            if (stripos($item['name'], '2T') !== false) {
                $categoryName = 'Oli Samping (2T)';
            } elseif (stripos($item['name'], 'Gardan') !== false || stripos($item['brand'], 'Gardan') !== false) {
                $categoryName = 'Oli Gardan / Transmisi';
            }
            $category = Category::where('name', $categoryName)->first();
            if (! $category) {
                $category = Category::create(['name' => $categoryName]);
            }

            $productName = $item['name'];
            if (strpos(strtolower($productName), strtolower($item['brand'])) === false && strpos(strtolower($item['brand']), 'oli gardan') === false) {
                $productName = $item['brand'].' '.$productName;
            }

            $product = Product::where('name', $productName)->first();

            if ($product) {
                $product->update([
                    'category_id' => $category->id,
                    'price' => $item['price'],
                ]);
            } else {
                Product::create([
                    'name' => $productName,
                    'category_id' => $category->id,
                    'sku' => strtoupper(Str::random(8)),
                    'price' => $item['price'],
                    'stock' => 100, // Default stock
                    'minimum_stock' => 5,
                    'unit' => 'botol',
                    'is_available' => true,
                ]);
            }
        }
    }
}
