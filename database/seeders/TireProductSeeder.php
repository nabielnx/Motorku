<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class TireProductSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $items = array (
  0 =>
  array (
    'brand' => 'IRC',
    'category_name' => 'Ban Luar (Pakai Ban Dalam)',
    'name' => 'Ban Luar IRC Ring 8 - 3.50 Non-Tubeless (Scooter / Vespa)',
    'size' => 'Ring 8 - 3.50',
    'peruntukan' => 'Scooter / Vespa',
    'cost_price' => NULL,
    'price' => 185000.0,
    'description' => 'Ban luar IRC Non-Tubeless ukuran Ring 8 - 3.50. Peruntukan: Scooter / Vespa.',
  ),
  1 =>
  array (
    'brand' => 'IRC',
    'category_name' => 'Ban Luar (Pakai Ban Dalam)',
    'name' => 'Ban Luar IRC Ring 14 - 70/90 Non-Tubeless (Matic Ring 14)',
    'size' => 'Ring 14 - 70/90',
    'peruntukan' => 'Matic Ring 14',
    'cost_price' => NULL,
    'price' => 192000.0,
    'description' => 'Ban luar IRC Non-Tubeless ukuran Ring 14 - 70/90. Peruntukan: Matic Ring 14.',
  ),
  2 =>
  array (
    'brand' => 'IRC',
    'category_name' => 'Ban Luar (Pakai Ban Dalam)',
    'name' => 'Ban Luar IRC Ring 14 - 80/90 Non-Tubeless (Matic Ring 14)',
    'size' => 'Ring 14 - 80/90',
    'peruntukan' => 'Matic Ring 14',
    'cost_price' => NULL,
    'price' => 227000.0,
    'description' => 'Ban luar IRC Non-Tubeless ukuran Ring 14 - 80/90. Peruntukan: Matic Ring 14.',
  ),
  3 =>
  array (
    'brand' => 'IRC',
    'category_name' => 'Ban Luar (Pakai Ban Dalam)',
    'name' => 'Ban Luar IRC Ring 14 - 80/90 TR Non-Tubeless (Matic Trail / Semi)',
    'size' => 'Ring 14 - 80/90 TR',
    'peruntukan' => 'Matic Trail / Semi',
    'cost_price' => NULL,
    'price' => 270000.0,
    'description' => 'Ban luar IRC Non-Tubeless ukuran Ring 14 - 80/90 TR. Peruntukan: Matic Trail / Semi.',
  ),
  4 =>
  array (
    'brand' => 'IRC',
    'category_name' => 'Ban Luar (Pakai Ban Dalam)',
    'name' => 'Ban Luar IRC Ring 14 - 90/90 Non-Tubeless (Matic Ring 14)',
    'size' => 'Ring 14 - 90/90',
    'peruntukan' => 'Matic Ring 14',
    'cost_price' => NULL,
    'price' => 272000.0,
    'description' => 'Ban luar IRC Non-Tubeless ukuran Ring 14 - 90/90. Peruntukan: Matic Ring 14.',
  ),
  5 =>
  array (
    'brand' => 'IRC',
    'category_name' => 'Ban Luar (Pakai Ban Dalam)',
    'name' => 'Ban Luar IRC Ring 14 - 90/90 TR Non-Tubeless (Matic Trail / Semi)',
    'size' => 'Ring 14 - 90/90 TR',
    'peruntukan' => 'Matic Trail / Semi',
    'cost_price' => NULL,
    'price' => 290000.0,
    'description' => 'Ban luar IRC Non-Tubeless ukuran Ring 14 - 90/90 TR. Peruntukan: Matic Trail / Semi.',
  ),
  6 =>
  array (
    'brand' => 'IRC',
    'category_name' => 'Ban Luar (Pakai Ban Dalam)',
    'name' => 'Ban Luar IRC Ring 16 - 70/90 Non-Tubeless (Matic Ring 16 - Nouvo/Skywave)',
    'size' => 'Ring 16 - 70/90',
    'peruntukan' => 'Matic Ring 16 (Nouvo/Skywave)',
    'cost_price' => NULL,
    'price' => 218000.0,
    'description' => 'Ban luar IRC Non-Tubeless ukuran Ring 16 - 70/90. Peruntukan: Matic Ring 16 (Nouvo/Skywave).',
  ),
  7 =>
  array (
    'brand' => 'IRC',
    'category_name' => 'Ban Luar (Pakai Ban Dalam)',
    'name' => 'Ban Luar IRC Ring 16 - 80/90 Non-Tubeless (Matic Ring 16 - Nouvo/Skywave)',
    'size' => 'Ring 16 - 80/90',
    'peruntukan' => 'Matic Ring 16 (Nouvo/Skywave)',
    'cost_price' => NULL,
    'price' => 265000.0,
    'description' => 'Ban luar IRC Non-Tubeless ukuran Ring 16 - 80/90. Peruntukan: Matic Ring 16 (Nouvo/Skywave).',
  ),
  8 =>
  array (
    'brand' => 'IRC',
    'category_name' => 'Ban Luar (Pakai Ban Dalam)',
    'name' => 'Ban Luar IRC Ring 17 - 2.25 Non-Tubeless (Bebek Ring 17)',
    'size' => 'Ring 17 - 2.25',
    'peruntukan' => 'Bebek Ring 17',
    'cost_price' => NULL,
    'price' => 185000.0,
    'description' => 'Ban luar IRC Non-Tubeless ukuran Ring 17 - 2.25. Peruntukan: Bebek Ring 17.',
  ),
  9 =>
  array (
    'brand' => 'IRC',
    'category_name' => 'Ban Luar (Pakai Ban Dalam)',
    'name' => 'Ban Luar IRC Ring 17 - 2.50 Non-Tubeless (Bebek Ring 17)',
    'size' => 'Ring 17 - 2.50',
    'peruntukan' => 'Bebek Ring 17',
    'cost_price' => NULL,
    'price' => 227000.0,
    'description' => 'Ban luar IRC Non-Tubeless ukuran Ring 17 - 2.50. Peruntukan: Bebek Ring 17.',
  ),
  10 =>
  array (
    'brand' => 'IRC',
    'category_name' => 'Ban Luar (Pakai Ban Dalam)',
    'name' => 'Ban Luar IRC Ring 17 - 70/90 Non-Tubeless (Bebek Ring 17)',
    'size' => 'Ring 17 - 70/90',
    'peruntukan' => 'Bebek Ring 17',
    'cost_price' => NULL,
    'price' => 228000.0,
    'description' => 'Ban luar IRC Non-Tubeless ukuran Ring 17 - 70/90. Peruntukan: Bebek Ring 17.',
  ),
  11 =>
  array (
    'brand' => 'IRC',
    'category_name' => 'Ban Luar (Pakai Ban Dalam)',
    'name' => 'Ban Luar IRC Ring 17 - 2.50 TR Non-Tubeless (Bebek Trail / Semi)',
    'size' => 'Ring 17 - 2.50 TR',
    'peruntukan' => 'Bebek Trail / Semi',
    'cost_price' => NULL,
    'price' => 240000.0,
    'description' => 'Ban luar IRC Non-Tubeless ukuran Ring 17 - 2.50 TR. Peruntukan: Bebek Trail / Semi.',
  ),
  12 =>
  array (
    'brand' => 'IRC',
    'category_name' => 'Ban Luar (Pakai Ban Dalam)',
    'name' => 'Ban Luar IRC Ring 17 - 2.75 Non-Tubeless (Bebek Ring 17)',
    'size' => 'Ring 17 - 2.75',
    'peruntukan' => 'Bebek Ring 17',
    'cost_price' => NULL,
    'price' => 272000.0,
    'description' => 'Ban luar IRC Non-Tubeless ukuran Ring 17 - 2.75. Peruntukan: Bebek Ring 17.',
  ),
  13 =>
  array (
    'brand' => 'IRC',
    'category_name' => 'Ban Luar (Pakai Ban Dalam)',
    'name' => 'Ban Luar IRC Ring 17 - 80/90 Non-Tubeless (Bebek Ring 17)',
    'size' => 'Ring 17 - 80/90',
    'peruntukan' => 'Bebek Ring 17',
    'cost_price' => NULL,
    'price' => 272000.0,
    'description' => 'Ban luar IRC Non-Tubeless ukuran Ring 17 - 80/90. Peruntukan: Bebek Ring 17.',
  ),
  14 =>
  array (
    'brand' => 'IRC',
    'category_name' => 'Ban Luar (Pakai Ban Dalam)',
    'name' => 'Ban Luar IRC Ring 17 - 2.75 TR Non-Tubeless (Bebek Trail / Semi)',
    'size' => 'Ring 17 - 2.75 TR',
    'peruntukan' => 'Bebek Trail / Semi',
    'cost_price' => NULL,
    'price' => 290000.0,
    'description' => 'Ban luar IRC Non-Tubeless ukuran Ring 17 - 2.75 TR. Peruntukan: Bebek Trail / Semi.',
  ),
  15 =>
  array (
    'brand' => 'IRC',
    'category_name' => 'Ban Luar (Pakai Ban Dalam)',
    'name' => 'Ban Luar IRC Ring 17 - 3.00 Non-Tubeless (Sport / Bebek)',
    'size' => 'Ring 17 - 3.00',
    'peruntukan' => 'Sport / Bebek',
    'cost_price' => NULL,
    'price' => 338000.0,
    'description' => 'Ban luar IRC Non-Tubeless ukuran Ring 17 - 3.00. Peruntukan: Sport / Bebek.',
  ),
  16 =>
  array (
    'brand' => 'IRC',
    'category_name' => 'Ban Luar (Pakai Ban Dalam)',
    'name' => 'Ban Luar IRC Ring 17 - 90/90 Non-Tubeless (Sport / Bebek)',
    'size' => 'Ring 17 - 90/90',
    'peruntukan' => 'Sport / Bebek',
    'cost_price' => NULL,
    'price' => 358000.0,
    'description' => 'Ban luar IRC Non-Tubeless ukuran Ring 17 - 90/90. Peruntukan: Sport / Bebek.',
  ),
  17 =>
  array (
    'brand' => 'IRC',
    'category_name' => 'Ban Luar (Pakai Ban Dalam)',
    'name' => 'Ban Luar IRC Ring 17 - 80/100 Non-Tubeless (Sport / Trail)',
    'size' => 'Ring 17 - 80/100',
    'peruntukan' => 'Sport / Trail',
    'cost_price' => NULL,
    'price' => 275000.0,
    'description' => 'Ban luar IRC Non-Tubeless ukuran Ring 17 - 80/100. Peruntukan: Sport / Trail.',
  ),
  18 =>
  array (
    'brand' => 'IRC',
    'category_name' => 'Ban Luar (Pakai Ban Dalam)',
    'name' => 'Ban Luar IRC Ring 17 - 100/90 Non-Tubeless (Sport / Trail)',
    'size' => 'Ring 17 - 100/90',
    'peruntukan' => 'Sport / Trail',
    'cost_price' => NULL,
    'price' => 340000.0,
    'description' => 'Ban luar IRC Non-Tubeless ukuran Ring 17 - 100/90. Peruntukan: Sport / Trail.',
  ),
  19 =>
  array (
    'brand' => 'IRC',
    'category_name' => 'Ban Luar (Pakai Ban Dalam)',
    'name' => 'Ban Luar IRC Ring 18 - 2.50 Non-Tubeless (Sport Ring 18)',
    'size' => 'Ring 18 - 2.50',
    'peruntukan' => 'Sport Ring 18',
    'cost_price' => NULL,
    'price' => 240000.0,
    'description' => 'Ban luar IRC Non-Tubeless ukuran Ring 18 - 2.50. Peruntukan: Sport Ring 18.',
  ),
  20 =>
  array (
    'brand' => 'IRC',
    'category_name' => 'Ban Luar (Pakai Ban Dalam)',
    'name' => 'Ban Luar IRC Ring 18 - 2.75 Non-Tubeless (Sport Ring 18)',
    'size' => 'Ring 18 - 2.75',
    'peruntukan' => 'Sport Ring 18',
    'cost_price' => NULL,
    'price' => 295000.0,
    'description' => 'Ban luar IRC Non-Tubeless ukuran Ring 18 - 2.75. Peruntukan: Sport Ring 18.',
  ),
  21 =>
  array (
    'brand' => 'IRC',
    'category_name' => 'Ban Luar (Pakai Ban Dalam)',
    'name' => 'Ban Luar IRC Ring 18 - 3.00 Non-Tubeless (Sport Ring 18)',
    'size' => 'Ring 18 - 3.00',
    'peruntukan' => 'Sport Ring 18',
    'cost_price' => NULL,
    'price' => 352000.0,
    'description' => 'Ban luar IRC Non-Tubeless ukuran Ring 18 - 3.00. Peruntukan: Sport Ring 18.',
  ),
  22 =>
  array (
    'brand' => 'IRC',
    'category_name' => 'Ban Luar (Pakai Ban Dalam)',
    'name' => 'Ban Luar IRC Ring 18 - 100/90 Non-Tubeless (Sport Ring 18)',
    'size' => 'Ring 18 - 100/90',
    'peruntukan' => 'Sport Ring 18',
    'cost_price' => NULL,
    'price' => 440000.0,
    'description' => 'Ban luar IRC Non-Tubeless ukuran Ring 18 - 100/90. Peruntukan: Sport Ring 18.',
  ),
  23 =>
  array (
    'brand' => 'IRC',
    'category_name' => 'Ban Luar Tubeless',
    'name' => 'Ban Luar IRC Ring 12 - 100/90 Tubeless (Scoopy Ring 12 Depan)',
    'size' => 'Ring 12 - 100/90',
    'peruntukan' => 'Scoopy Ring 12 Depan',
    'cost_price' => 227500.0,
    'price' => 257000.0,
    'description' => 'Ban luar IRC Tubeless ukuran Ring 12 - 100/90. Peruntukan: Scoopy Ring 12 Depan.',
  ),
  24 =>
  array (
    'brand' => 'IRC',
    'category_name' => 'Ban Luar Tubeless',
    'name' => 'Ban Luar IRC Ring 12 - 110/90 Tubeless (Scoopy Ring 12 Belakang)',
    'size' => 'Ring 12 - 110/90',
    'peruntukan' => 'Scoopy Ring 12 Belakang',
    'cost_price' => 273000.0,
    'price' => 303000.0,
    'description' => 'Ban luar IRC Tubeless ukuran Ring 12 - 110/90. Peruntukan: Scoopy Ring 12 Belakang.',
  ),
  25 =>
  array (
    'brand' => 'IRC',
    'category_name' => 'Ban Luar Tubeless',
    'name' => 'Ban Luar IRC Ring 12 - 110/70 Tubeless (Fazzio Depan & Belakang)',
    'size' => 'Ring 12 - 110/70',
    'peruntukan' => 'Fazzio Depan & Belakang',
    'cost_price' => 241500.0,
    'price' => 262000.0,
    'description' => 'Ban luar IRC Tubeless ukuran Ring 12 - 110/70. Peruntukan: Fazzio Depan & Belakang.',
  ),
  26 =>
  array (
    'brand' => 'IRC',
    'category_name' => 'Ban Luar Tubeless',
    'name' => 'Ban Luar IRC Ring 13 - 110/70 Tubeless (NMAX Depan)',
    'size' => 'Ring 13 - 110/70',
    'peruntukan' => 'NMAX Depan',
    'cost_price' => 262500.0,
    'price' => 290000.0,
    'description' => 'Ban luar IRC Tubeless ukuran Ring 13 - 110/70. Peruntukan: NMAX Depan.',
  ),
  27 =>
  array (
    'brand' => 'IRC',
    'category_name' => 'Ban Luar Tubeless',
    'name' => 'Ban Luar IRC Ring 13 - 130/70 Tubeless (NMAX / PCX 160 Belakang)',
    'size' => 'Ring 13 - 130/70',
    'peruntukan' => 'NMAX / PCX 160 Belakang',
    'cost_price' => 332500.0,
    'price' => 369000.0,
    'description' => 'Ban luar IRC Tubeless ukuran Ring 13 - 130/70. Peruntukan: NMAX / PCX 160 Belakang.',
  ),
  28 =>
  array (
    'brand' => 'IRC',
    'category_name' => 'Ban Luar Tubeless',
    'name' => 'Ban Luar IRC Ring 14 - 110/70 Tubeless (PCX 160 Depan)',
    'size' => 'Ring 14 - 110/70',
    'peruntukan' => 'PCX 160 Depan',
    'cost_price' => 290500.0,
    'price' => 323000.0,
    'description' => 'Ban luar IRC Tubeless ukuran Ring 14 - 110/70. Peruntukan: PCX 160 Depan.',
  ),
  29 =>
  array (
    'brand' => 'IRC',
    'category_name' => 'Ban Luar Tubeless',
    'name' => 'Ban Luar IRC Ring 14 - 70/90 Tubeless (MIO)',
    'size' => 'Ring 14 - 70/90',
    'peruntukan' => 'MIO',
    'cost_price' => 164500.0,
    'price' => 183000.0,
    'description' => 'Ban luar IRC Tubeless ukuran Ring 14 - 70/90. Peruntukan: MIO.',
  ),
  30 =>
  array (
    'brand' => 'IRC',
    'category_name' => 'Ban Luar Tubeless',
    'name' => 'Ban Luar IRC Ring 14 - 80/90 Tubeless (Beat / Vario Depan & MIO Belakang)',
    'size' => 'Ring 14 - 80/90',
    'peruntukan' => 'Beat / Vario Depan & MIO Belakang',
    'cost_price' => 206500.0,
    'price' => 230000.0,
    'description' => 'Ban luar IRC Tubeless ukuran Ring 14 - 80/90. Peruntukan: Beat / Vario Depan & MIO Belakang.',
  ),
  31 =>
  array (
    'brand' => 'IRC',
    'category_name' => 'Ban Luar Tubeless',
    'name' => 'Ban Luar IRC Ring 14 - 90/90 Tubeless (Beat / Vario Belakang & MIO Depan)',
    'size' => 'Ring 14 - 90/90',
    'peruntukan' => 'Beat / Vario Belakang & MIO Depan',
    'cost_price' => 231000.0,
    'price' => 258000.0,
    'description' => 'Ban luar IRC Tubeless ukuran Ring 14 - 90/90. Peruntukan: Beat / Vario Belakang & MIO Depan.',
  ),
  32 =>
  array (
    'brand' => 'IRC',
    'category_name' => 'Ban Luar Tubeless',
    'name' => 'Ban Luar IRC Ring 14 - 90/80 Tubeless (Vario 125 Baru / 150 Depan)',
    'size' => 'Ring 14 - 90/80',
    'peruntukan' => 'Vario 125 Baru / 150 Depan',
    'cost_price' => 231000.0,
    'price' => 258000.0,
    'description' => 'Ban luar IRC Tubeless ukuran Ring 14 - 90/80. Peruntukan: Vario 125 Baru / 150 Depan.',
  ),
  33 =>
  array (
    'brand' => 'IRC',
    'category_name' => 'Ban Luar Tubeless',
    'name' => 'Ban Luar IRC Ring 14 - 100/80 Tubeless (Vario 150 Belakang / PCX 150 Depan)',
    'size' => 'Ring 14 - 100/80',
    'peruntukan' => 'Vario 150 Belakang / PCX 150 Depan',
    'cost_price' => 264600.0,
    'price' => 294000.0,
    'description' => 'Ban luar IRC Tubeless ukuran Ring 14 - 100/80. Peruntukan: Vario 150 Belakang / PCX 150 Depan.',
  ),
  34 =>
  array (
    'brand' => 'IRC',
    'category_name' => 'Ban Luar Tubeless',
    'name' => 'Ban Luar IRC Ring 14 - 120/70 Tubeless (PCX 150/160 / Vario 160 Belakang)',
    'size' => 'Ring 14 - 120/70',
    'peruntukan' => 'PCX 150/160 / Vario 160 Belakang',
    'cost_price' => 318500.0,
    'price' => 356000.0,
    'description' => 'Ban luar IRC Tubeless ukuran Ring 14 - 120/70. Peruntukan: PCX 150/160 / Vario 160 Belakang.',
  ),
  35 =>
  array (
    'brand' => 'IRC',
    'category_name' => 'Ban Luar Tubeless',
    'name' => 'Ban Luar IRC Ring 14 - 100/90 Tubeless (Lexi / Freego Belakang)',
    'size' => 'Ring 14 - 100/90',
    'peruntukan' => 'Lexi / Freego Belakang',
    'cost_price' => 290500.0,
    'price' => 327000.0,
    'description' => 'Ban luar IRC Tubeless ukuran Ring 14 - 100/90. Peruntukan: Lexi / Freego Belakang.',
  ),
  36 =>
  array (
    'brand' => 'IRC',
    'category_name' => 'Ban Luar Tubeless',
    'name' => 'Ban Luar IRC Ring 14 - 110/80 Tubeless (Aerox 155 Depan)',
    'size' => 'Ring 14 - 110/80',
    'peruntukan' => 'Aerox 155 Depan',
    'cost_price' => 297500.0,
    'price' => 326000.0,
    'description' => 'Ban luar IRC Tubeless ukuran Ring 14 - 110/80. Peruntukan: Aerox 155 Depan.',
  ),
  37 =>
  array (
    'brand' => 'IRC',
    'category_name' => 'Ban Luar Tubeless',
    'name' => 'Ban Luar IRC Ring 14 - 140/70 Tubeless (Aerox 155 Belakang)',
    'size' => 'Ring 14 - 140/70',
    'peruntukan' => 'Aerox 155 Belakang',
    'cost_price' => 385000.0,
    'price' => 431000.0,
    'description' => 'Ban luar IRC Tubeless ukuran Ring 14 - 140/70. Peruntukan: Aerox 155 Belakang.',
  ),
  38 =>
  array (
    'brand' => 'IRC',
    'category_name' => 'Ban Luar Tubeless',
    'name' => 'Ban Luar IRC Ring 14 - 110/80 Tubeless (ADV 150 / 160 Depan)',
    'size' => 'Ring 14 - 110/80',
    'peruntukan' => 'ADV 150 / 160 Depan',
    'cost_price' => 301000.0,
    'price' => 330000.0,
    'description' => 'Ban luar IRC Tubeless ukuran Ring 14 - 110/80. Peruntukan: ADV 150 / 160 Depan.',
  ),
  39 =>
  array (
    'brand' => 'IRC',
    'category_name' => 'Ban Luar Tubeless',
    'name' => 'Ban Luar IRC Ring 13 - 130/70 Tubeless (ADV 150 / 160 Belakang)',
    'size' => 'Ring 13 - 130/70',
    'peruntukan' => 'ADV 150 / 160 Belakang',
    'cost_price' => 294000.0,
    'price' => 322000.0,
    'description' => 'Ban luar IRC Tubeless ukuran Ring 13 - 130/70. Peruntukan: ADV 150 / 160 Belakang.',
  ),
  40 =>
  array (
    'brand' => 'IRC',
    'category_name' => 'Ban Luar Tubeless',
    'name' => 'Ban Luar IRC Ring 17 - 70/90 Tubeless (Bebek Depan - Supra/Jupiter/Revo)',
    'size' => 'Ring 17 - 70/90',
    'peruntukan' => 'Bebek Depan (Supra/Jupiter/Revo)',
    'cost_price' => 189000.0,
    'price' => 212000.0,
    'description' => 'Ban luar IRC Tubeless ukuran Ring 17 - 70/90. Peruntukan: Bebek Depan (Supra/Jupiter/Revo).',
  ),
  41 =>
  array (
    'brand' => 'IRC',
    'category_name' => 'Ban Luar Tubeless',
    'name' => 'Ban Luar IRC Ring 17 - 80/90 Tubeless (Bebek Belakang - Supra/Jupiter/Revo)',
    'size' => 'Ring 17 - 80/90',
    'peruntukan' => 'Bebek Belakang (Supra/Jupiter/Revo)',
    'cost_price' => 234500.0,
    'price' => 260000.0,
    'description' => 'Ban luar IRC Tubeless ukuran Ring 17 - 80/90. Peruntukan: Bebek Belakang (Supra/Jupiter/Revo).',
  ),
  42 =>
  array (
    'brand' => 'IRC',
    'category_name' => 'Ban Luar Tubeless',
    'name' => 'Ban Luar IRC Ring 17 - 80/100 Tubeless (New Megapro / Verza Depan)',
    'size' => 'Ring 17 - 80/100',
    'peruntukan' => 'New Megapro / Verza Depan',
    'cost_price' => 238000.0,
    'price' => 260000.0,
    'description' => 'Ban luar IRC Tubeless ukuran Ring 17 - 80/100. Peruntukan: New Megapro / Verza Depan.',
  ),
  43 =>
  array (
    'brand' => 'IRC',
    'category_name' => 'Ban Luar Tubeless',
    'name' => 'Ban Luar IRC Ring 17 - 100/90 Tubeless (New Megapro / Verza Belakang)',
    'size' => 'Ring 17 - 100/90',
    'peruntukan' => 'New Megapro / Verza Belakang',
    'cost_price' => 329000.0,
    'price' => 362000.0,
    'description' => 'Ban luar IRC Tubeless ukuran Ring 17 - 100/90. Peruntukan: New Megapro / Verza Belakang.',
  ),
  44 =>
  array (
    'brand' => 'IRC',
    'category_name' => 'Ban Luar Tubeless',
    'name' => 'Ban Luar IRC Ring 17 - 90/80 Tubeless (Vixion Depan)',
    'size' => 'Ring 17 - 90/80',
    'peruntukan' => 'Vixion Depan',
    'cost_price' => 273000.0,
    'price' => 301000.0,
    'description' => 'Ban luar IRC Tubeless ukuran Ring 17 - 90/80. Peruntukan: Vixion Depan.',
  ),
  45 =>
  array (
    'brand' => 'IRC',
    'category_name' => 'Ban Luar Tubeless',
    'name' => 'Ban Luar IRC Ring 17 - 120/70 Tubeless (Vixion Belakang)',
    'size' => 'Ring 17 - 120/70',
    'peruntukan' => 'Vixion Belakang',
    'cost_price' => 395500.0,
    'price' => 436000.0,
    'description' => 'Ban luar IRC Tubeless ukuran Ring 17 - 120/70. Peruntukan: Vixion Belakang.',
  ),
  46 =>
  array (
    'brand' => 'IRC',
    'category_name' => 'Ban Luar Tubeless',
    'name' => 'Ban Luar IRC Ring 17 - 100/80 Tubeless (CB150R / CBR 150R Depan)',
    'size' => 'Ring 17 - 100/80',
    'peruntukan' => 'CB150R / CBR 150R Depan',
    'cost_price' => 332500.0,
    'price' => 363000.0,
    'description' => 'Ban luar IRC Tubeless ukuran Ring 17 - 100/80. Peruntukan: CB150R / CBR 150R Depan.',
  ),
  47 =>
  array (
    'brand' => 'IRC',
    'category_name' => 'Ban Luar Tubeless',
    'name' => 'Ban Luar IRC Ring 17 - 130/70 Tubeless (CB150R / CBR 150R Belakang)',
    'size' => 'Ring 17 - 130/70',
    'peruntukan' => 'CB150R / CBR 150R Belakang',
    'cost_price' => 486500.0,
    'price' => 535000.0,
    'description' => 'Ban luar IRC Tubeless ukuran Ring 17 - 130/70. Peruntukan: CB150R / CBR 150R Belakang.',
  ),
  48 =>
  array (
    'brand' => 'IRC',
    'category_name' => 'Ban Dalam',
    'name' => 'Ban Dalam IRC Ring 8 - 3.50 (Vespa / Skuter R8)',
    'size' => 'Ring 8 - 3.50',
    'peruntukan' => 'Vespa / Skuter R8',
    'cost_price' => 36500.0,
    'price' => 48000.0,
    'description' => 'Ban dalam IRC ukuran Ring 8 - 3.50. Peruntukan: Vespa / Skuter R8.',
  ),
  49 =>
  array (
    'brand' => 'IRC',
    'category_name' => 'Ban Dalam',
    'name' => 'Ban Dalam IRC Ring 14 - 70/90 (2.50-14) (Skutik Ring 14 Depan)',
    'size' => 'Ring 14 - 70/90 (2.50-14)',
    'peruntukan' => 'Skutik Ring 14 Depan',
    'cost_price' => 33000.0,
    'price' => 41000.0,
    'description' => 'Ban dalam IRC ukuran Ring 14 - 70/90 (2.50-14). Peruntukan: Skutik Ring 14 Depan.',
  ),
  50 =>
  array (
    'brand' => 'IRC',
    'category_name' => 'Ban Dalam',
    'name' => 'Ban Dalam IRC Ring 14 - 80/90 (2.75-14) (Skutik Ring 14 Depan/Belakang)',
    'size' => 'Ring 14 - 80/90 (2.75-14)',
    'peruntukan' => 'Skutik Ring 14 Depan/Belakang',
    'cost_price' => 34500.0,
    'price' => 44500.0,
    'description' => 'Ban dalam IRC ukuran Ring 14 - 80/90 (2.75-14). Peruntukan: Skutik Ring 14 Depan/Belakang.',
  ),
  51 =>
  array (
    'brand' => 'IRC',
    'category_name' => 'Ban Dalam',
    'name' => 'Ban Dalam IRC Ring 14 - 90/90 (3.00-14) (Skutik Ring 14 Belakang)',
    'size' => 'Ring 14 - 90/90 (3.00-14)',
    'peruntukan' => 'Skutik Ring 14 Belakang',
    'cost_price' => 41000.0,
    'price' => 54000.0,
    'description' => 'Ban dalam IRC ukuran Ring 14 - 90/90 (3.00-14). Peruntukan: Skutik Ring 14 Belakang.',
  ),
  52 =>
  array (
    'brand' => 'IRC',
    'category_name' => 'Ban Dalam',
    'name' => 'Ban Dalam IRC Ring 14 - 2.75 / 3.00 (Skutik Ring 14 Lebar)',
    'size' => 'Ring 14 - 2.75 / 3.00',
    'peruntukan' => 'Skutik Ring 14 Lebar',
    'cost_price' => 37000.0,
    'price' => 49000.0,
    'description' => 'Ban dalam IRC ukuran Ring 14 - 2.75 / 3.00. Peruntukan: Skutik Ring 14 Lebar.',
  ),
  53 =>
  array (
    'brand' => 'IRC',
    'category_name' => 'Ban Dalam',
    'name' => 'Ban Dalam IRC Ring 16 - 70/90 (Skutik Ring 16 - Nouvo/Skywave)',
    'size' => 'Ring 16 - 70/90',
    'peruntukan' => 'Skutik Ring 16 (Nouvo/Skywave)',
    'cost_price' => 34500.0,
    'price' => 45000.0,
    'description' => 'Ban dalam IRC ukuran Ring 16 - 70/90. Peruntukan: Skutik Ring 16 (Nouvo/Skywave).',
  ),
  54 =>
  array (
    'brand' => 'IRC',
    'category_name' => 'Ban Dalam',
    'name' => 'Ban Dalam IRC Ring 16 - 80/90 (Skutik Ring 16 - Nouvo/Skywave)',
    'size' => 'Ring 16 - 80/90',
    'peruntukan' => 'Skutik Ring 16 (Nouvo/Skywave)',
    'cost_price' => 37500.0,
    'price' => 50000.0,
    'description' => 'Ban dalam IRC ukuran Ring 16 - 80/90. Peruntukan: Skutik Ring 16 (Nouvo/Skywave).',
  ),
  55 =>
  array (
    'brand' => 'IRC',
    'category_name' => 'Ban Dalam',
    'name' => 'Ban Dalam IRC Ring 17 - 2.25 / 2.50 (70/90-17) (Bebek Ring 17 Depan)',
    'size' => 'Ring 17 - 2.25 / 2.50 (70/90-17)',
    'peruntukan' => 'Bebek Ring 17 Depan',
    'cost_price' => 34500.0,
    'price' => 45000.0,
    'description' => 'Ban dalam IRC ukuran Ring 17 - 2.25 / 2.50 (70/90-17). Peruntukan: Bebek Ring 17 Depan.',
  ),
  56 =>
  array (
    'brand' => 'IRC',
    'category_name' => 'Ban Dalam',
    'name' => 'Ban Dalam IRC Ring 17 - 2.50 / 2.75 (80/90-17) (Bebek Ring 17 Belakang)',
    'size' => 'Ring 17 - 2.50 / 2.75 (80/90-17)',
    'peruntukan' => 'Bebek Ring 17 Belakang',
    'cost_price' => 37500.0,
    'price' => 50000.0,
    'description' => 'Ban dalam IRC ukuran Ring 17 - 2.50 / 2.75 (80/90-17). Peruntukan: Bebek Ring 17 Belakang.',
  ),
  57 =>
  array (
    'brand' => 'IRC',
    'category_name' => 'Ban Dalam',
    'name' => 'Ban Dalam IRC Ring 17 - 2.75 (Bebek / Sport Ring 17)',
    'size' => 'Ring 17 - 2.75',
    'peruntukan' => 'Bebek / Sport Ring 17',
    'cost_price' => 39000.0,
    'price' => 51000.0,
    'description' => 'Ban dalam IRC ukuran Ring 17 - 2.75. Peruntukan: Bebek / Sport Ring 17.',
  ),
  58 =>
  array (
    'brand' => 'IRC',
    'category_name' => 'Ban Dalam',
    'name' => 'Ban Dalam IRC Ring 17 - 3.00 (Sport Ring 17)',
    'size' => 'Ring 17 - 3.00',
    'peruntukan' => 'Sport Ring 17',
    'cost_price' => 41500.0,
    'price' => 57000.0,
    'description' => 'Ban dalam IRC ukuran Ring 17 - 3.00. Peruntukan: Sport Ring 17.',
  ),
  59 =>
  array (
    'brand' => 'IRC',
    'category_name' => 'Ban Dalam',
    'name' => 'Ban Dalam IRC Ring 18 - 2.25 / 2.50 (Sport Ring 18)',
    'size' => 'Ring 18 - 2.25 / 2.50',
    'peruntukan' => 'Sport Ring 18',
    'cost_price' => 37000.0,
    'price' => 49000.0,
    'description' => 'Ban dalam IRC ukuran Ring 18 - 2.25 / 2.50. Peruntukan: Sport Ring 18.',
  ),
  60 =>
  array (
    'brand' => 'IRC',
    'category_name' => 'Ban Dalam',
    'name' => 'Ban Dalam IRC Ring 18 - 2.75 / 3.00 (Sport Ring 18)',
    'size' => 'Ring 18 - 2.75 / 3.00',
    'peruntukan' => 'Sport Ring 18',
    'cost_price' => 42500.0,
    'price' => 58000.0,
    'description' => 'Ban dalam IRC ukuran Ring 18 - 2.75 / 3.00. Peruntukan: Sport Ring 18.',
  ),
  61 =>
  array (
    'brand' => 'AHM',
    'category_name' => 'Ban Luar (Pakai Ban Dalam)',
    'name' => 'Ban Luar AHM Ring 17 - 70/90 (2.25) Non-Tubeless (Bebek Honda Depan - Supra / Revo / Blade)',
    'size' => 'Ring 17 - 70/90 (2.25)',
    'peruntukan' => 'Bebek Honda Depan (Supra / Revo / Blade)',
    'cost_price' => NULL,
    'price' => 199000.0,
    'description' => 'Ban luar AHM Non-Tubeless ukuran Ring 17 - 70/90 (2.25). Peruntukan: Bebek Honda Depan (Supra / Revo / Blade).',
  ),
  62 =>
  array (
    'brand' => 'AHM',
    'category_name' => 'Ban Luar (Pakai Ban Dalam)',
    'name' => 'Ban Luar AHM Ring 17 - 2.50 Non-Tubeless (Bebek Honda Standar)',
    'size' => 'Ring 17 - 2.50',
    'peruntukan' => 'Bebek Honda Standar',
    'cost_price' => NULL,
    'price' => 162000.0,
    'description' => 'Ban luar AHM Non-Tubeless ukuran Ring 17 - 2.50. Peruntukan: Bebek Honda Standar.',
  ),
  63 =>
  array (
    'brand' => 'AHM',
    'category_name' => 'Ban Luar (Pakai Ban Dalam)',
    'name' => 'Ban Luar AHM Ring 17 - 80/90 (2.75) Non-Tubeless (Bebek Honda Belakang - Supra / Revo / Blade)',
    'size' => 'Ring 17 - 80/90 (2.75)',
    'peruntukan' => 'Bebek Honda Belakang (Supra / Revo / Blade)',
    'cost_price' => NULL,
    'price' => 233000.0,
    'description' => 'Ban luar AHM Non-Tubeless ukuran Ring 17 - 80/90 (2.75). Peruntukan: Bebek Honda Belakang (Supra / Revo / Blade).',
  ),
  64 =>
  array (
    'brand' => 'AHM',
    'category_name' => 'Ban Luar (Pakai Ban Dalam)',
    'name' => 'Ban Luar AHM Ring 17 - 2.75 Non-Tubeless (Bebek Honda Belakang)',
    'size' => 'Ring 17 - 2.75',
    'peruntukan' => 'Bebek Honda Belakang',
    'cost_price' => NULL,
    'price' => 195000.0,
    'description' => 'Ban luar AHM Non-Tubeless ukuran Ring 17 - 2.75. Peruntukan: Bebek Honda Belakang.',
  ),
  65 =>
  array (
    'brand' => 'AHM',
    'category_name' => 'Ban Luar (Pakai Ban Dalam)',
    'name' => 'Ban Luar AHM Ring 14 - 80/90 Non-Tubeless (Skutik Honda Depan - Beat / Vario / Spacy)',
    'size' => 'Ring 14 - 80/90',
    'peruntukan' => 'Skutik Honda Depan (Beat / Vario / Spacy)',
    'cost_price' => NULL,
    'price' => 195000.0,
    'description' => 'Ban luar AHM Non-Tubeless ukuran Ring 14 - 80/90. Peruntukan: Skutik Honda Depan (Beat / Vario / Spacy).',
  ),
  66 =>
  array (
    'brand' => 'AHM',
    'category_name' => 'Ban Luar (Pakai Ban Dalam)',
    'name' => 'Ban Luar AHM Ring 14 - 90/90 Non-Tubeless (Skutik Honda Belakang - Beat / Vario / Spacy)',
    'size' => 'Ring 14 - 90/90',
    'peruntukan' => 'Skutik Honda Belakang (Beat / Vario / Spacy)',
    'cost_price' => NULL,
    'price' => 228000.0,
    'description' => 'Ban luar AHM Non-Tubeless ukuran Ring 14 - 90/90. Peruntukan: Skutik Honda Belakang (Beat / Vario / Spacy).',
  ),
  67 =>
  array (
    'brand' => 'AHM',
    'category_name' => 'Ban Luar Tubeless',
    'name' => 'Ban Luar AHM Ring 12 - 100/90 Tubeless (Scoopy Ring 12 Depan)',
    'size' => 'Ring 12 - 100/90',
    'peruntukan' => 'Scoopy Ring 12 Depan',
    'cost_price' => 245000.0,
    'price' => 268000.0,
    'description' => 'Ban luar AHM Tubeless ukuran Ring 12 - 100/90. Peruntukan: Scoopy Ring 12 Depan.',
  ),
  68 =>
  array (
    'brand' => 'AHM',
    'category_name' => 'Ban Luar Tubeless',
    'name' => 'Ban Luar AHM Ring 12 - 110/90 Tubeless (Scoopy Ring 12 Belakang)',
    'size' => 'Ring 12 - 110/90',
    'peruntukan' => 'Scoopy Ring 12 Belakang',
    'cost_price' => 270000.0,
    'price' => 298000.0,
    'description' => 'Ban luar AHM Tubeless ukuran Ring 12 - 110/90. Peruntukan: Scoopy Ring 12 Belakang.',
  ),
  69 =>
  array (
    'brand' => 'AHM',
    'category_name' => 'Ban Luar Tubeless',
    'name' => 'Ban Luar AHM Ring 14 - 80/90 Tubeless (Beat / Vario Depan)',
    'size' => 'Ring 14 - 80/90',
    'peruntukan' => 'Beat / Vario Depan',
    'cost_price' => 220000.0,
    'price' => 235000.0,
    'description' => 'Ban luar AHM Tubeless ukuran Ring 14 - 80/90. Peruntukan: Beat / Vario Depan.',
  ),
  70 =>
  array (
    'brand' => 'AHM',
    'category_name' => 'Ban Luar Tubeless',
    'name' => 'Ban Luar AHM Ring 14 - 90/90 Tubeless (Beat / Vario Belakang)',
    'size' => 'Ring 14 - 90/90',
    'peruntukan' => 'Beat / Vario Belakang',
    'cost_price' => 249000.0,
    'price' => 275000.0,
    'description' => 'Ban luar AHM Tubeless ukuran Ring 14 - 90/90. Peruntukan: Beat / Vario Belakang.',
  ),
  71 =>
  array (
    'brand' => 'AHM',
    'category_name' => 'Ban Luar Tubeless',
    'name' => 'Ban Luar AHM Ring 14 - 90/80 Tubeless (Vario 125 Baru / Vario 150 Depan)',
    'size' => 'Ring 14 - 90/80',
    'peruntukan' => 'Vario 125 Baru / Vario 150 Depan',
    'cost_price' => 246420.0,
    'price' => 272000.0,
    'description' => 'Ban luar AHM Tubeless ukuran Ring 14 - 90/80. Peruntukan: Vario 125 Baru / Vario 150 Depan.',
  ),
  72 =>
  array (
    'brand' => 'AHM',
    'category_name' => 'Ban Luar Tubeless',
    'name' => 'Ban Luar AHM Ring 14 - 100/80 Tubeless (Vario 150 / PCX 150 Belakang/Depan)',
    'size' => 'Ring 14 - 100/80',
    'peruntukan' => 'Vario 150 / PCX 150 Belakang/Depan',
    'cost_price' => 281940.0,
    'price' => 307000.0,
    'description' => 'Ban luar AHM Tubeless ukuran Ring 14 - 100/80. Peruntukan: Vario 150 / PCX 150 Belakang/Depan.',
  ),
);

        foreach ($items as $item) {
            $category = Category::where('name', $item['category_name'])->first();
            if (!$category) {
                $parent = Category::firstOrCreate(
                    ['name' => 'Ban & Kaki-kaki'],
                    ['description' => 'Ban Luar Tubeless, Ban Luar (Pakai Ban Dalam), Ban Dalam']
                );
                $category = Category::create([
                    'name' => $item['category_name'],
                    'parent_id' => $parent->id,
                ]);
            }

            $product = Product::where('name', $item['name'])->first();

            if ($product) {
                $product->update([
                    'category_id' => $category->id,
                    'brand' => $item['brand'],
                    'price' => $item['price'],
                    'cost_price' => $item['cost_price'],
                    'description' => $item['description'],
                    'unit' => 'pcs',
                ]);
            } else {
                Product::create([
                    'name' => $item['name'],
                    'category_id' => $category->id,
                    'brand' => $item['brand'],
                    'sku' => strtoupper(Str::random(8)),
                    'price' => $item['price'],
                    'cost_price' => $item['cost_price'],
                    'stock' => 50,
                    'minimum_stock' => 5,
                    'unit' => 'pcs',
                    'description' => $item['description'],
                    'is_available' => true,
                ]);
            }
        }
    }
}
