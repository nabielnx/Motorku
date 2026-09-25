<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Motorcycle;
use App\Models\MotorcyclePart;
use App\Models\Product;
use Illuminate\Database\Seeder;

class TireMotorcycleMappingSeeder extends Seeder
{
    /**
     * Map tire products from TireProductSeeder to motorcycles.
     *
     * Uses product name patterns (brand, size, type, peruntukan) to determine
     * which motorcycles each tire fits and whether it's depan/belakang/dalam.
     */
    public function run(): void
    {
        $motorcycles = Motorcycle::all();
        $tireProducts = Product::whereHas('category', function ($q) {
            $q->whereIn('name', [
                'Ban Luar Tubeless',
                'Ban Luar Biasa / Tube Type',
                'Ban Dalam',
            ]);
        })->get();

        if ($motorcycles->isEmpty() || $tireProducts->isEmpty()) {
            return;
        }

        foreach ($motorcycles as $motor) {
            $brand = strtolower($motor->brand);
            $type  = strtolower($motor->engine_type);
            $model = strtolower($motor->model);

            $isHonda   = ($brand === 'honda');
            $isYamaha  = ($brand === 'yamaha');
            $isSuzuki  = ($brand === 'suzuki');
            $isKawasaki = ($brand === 'kawasaki');

            $isMatic = ($type === 'matic');
            $isBebek = ($type === 'bebek');
            $isSport = ($type === 'sport');

            // ── Specific Model Detection ──
            $isNmax     = str_contains($model, 'nmax');
            $isAerox    = str_contains($model, 'aerox');
            $isPcx160   = str_contains($model, 'pcx 160');
            $isPcx150   = str_contains($model, 'pcx 150') || (str_contains($model, 'pcx') && !$isPcx160);
            $isAdv160   = str_contains($model, 'adv 160');
            $isAdv150   = str_contains($model, 'adv 150') || (str_contains($model, 'adv') && !$isAdv160);
            $isAdv      = str_contains($model, 'adv');
            $isVario160 = str_contains($model, 'vario 160');
            $isVarioMid = str_contains($model, 'vario 125') || str_contains($model, 'vario 150');
            $isVario110 = str_contains($model, 'vario 110');
            $isBeat     = str_contains($model, 'beat');
            $isScoopyR12 = str_contains($model, 'scoopy') && !str_contains($model, 'karbu');
            $isGenio    = str_contains($model, 'genio');
            $isSpacy    = str_contains($model, 'spacy');
            $isStyleo   = str_contains($model, 'stylo');
            $isFazzio   = str_contains($model, 'fazzio') || str_contains($model, 'filano');
            $isFreego   = str_contains($model, 'freego');
            $isMio      = str_contains($model, 'mio') || str_contains($model, 'fino') || str_contains($model, 'soul') || str_contains($model, 'gear');
            $isLexi     = str_contains($model, 'lexi');
            $isXmax     = str_contains($model, 'xmax');

            $isSupra    = str_contains($model, 'supra') && !str_contains($model, 'gtr');
            $isSupraGtr = str_contains($model, 'supra gtr') || str_contains($model, 'gtr');
            $isRevo     = str_contains($model, 'revo') || str_contains($model, 'blade');
            $isJupiter  = str_contains($model, 'jupiter') && !str_contains($model, 'mx');
            $isVega     = str_contains($model, 'vega');
            $isMxKing   = str_contains($model, 'mx king') || str_contains($model, 'jupiter mx');

            $isCb150    = str_contains($model, 'cb150') && !str_contains($model, 'cbr');
            $isCbr150   = str_contains($model, 'cbr150');
            $isCbr250   = str_contains($model, 'cbr250');
            $isSonic    = str_contains($model, 'sonic');
            $isMegapro  = str_contains($model, 'megapro');
            $isVerza    = str_contains($model, 'verza');
            $isCrf150   = str_contains($model, 'crf150');
            $isCrf250   = str_contains($model, 'crf250');
            $isCb150x   = str_contains($model, 'cb150x');

            $isVixion   = str_contains($model, 'vixion');
            $isR15      = str_contains($model, 'r15');
            $isR25      = str_contains($model, 'r25');
            $isMt15     = str_contains($model, 'mt-15');
            $isMt25     = str_contains($model, 'mt-25');
            $isXsr      = str_contains($model, 'xsr');
            $isByson    = str_contains($model, 'byson');
            $isWr155    = str_contains($model, 'wr155');

            $isNex      = str_contains($model, 'nex');
            $isAddress  = str_contains($model, 'address');
            $isAvenis   = str_contains($model, 'avenis');
            $isBurgman  = str_contains($model, 'burgman');
            $isSpin     = str_contains($model, 'spin');
            $isSkywave  = str_contains($model, 'skywave') || str_contains($model, 'skydrive');
            $isSmash    = str_contains($model, 'smash');
            $isShogun   = str_contains($model, 'shogun');
            $isSatria   = str_contains($model, 'satria');
            $isGsx      = str_contains($model, 'gsx');
            $isThunder  = str_contains($model, 'thunder');

            $isNinja    = str_contains($model, 'ninja');
            $isKlx      = str_contains($model, 'klx');
            $isDtracker = str_contains($model, 'd-tracker');
            $isW175     = str_contains($model, 'w175');
            $isAthlete  = str_contains($model, 'athlete');
            $isKazeR    = str_contains($model, 'kaze');

            // Retro R12 group (Scoopy new, Fazzio, Filano, FreeGo)
            $isRetroR12 = $isScoopyR12 || $isFazzio || $isFreego;

            // Helper closure
            $mapTire = function (string $productName, string $partCategory, string $notes, bool $isRecommended = false) use ($motor, $tireProducts) {
                $product = $tireProducts->firstWhere('name', $productName);
                if (!$product) {
                    return;
                }
                MotorcyclePart::updateOrCreate(
                    [
                        'motorcycle_id' => $motor->id,
                        'product_id'    => $product->id,
                    ],
                    [
                        'part_category'  => $partCategory,
                        'notes'          => $notes,
                        'is_recommended' => $isRecommended,
                    ]
                );
            };

            // =================================================================
            // BAN LUAR MAPPING
            // =================================================================

            // ── ADV 150 / ADV 160 ──
            // Depan: 110/80-14, Belakang: 130/70-13
            if ($isAdv) {
                // IRC Tubeless
                $mapTire('Ban Luar IRC Ring 14 - 110/80 Tubeless (ADV 150 / 160 Depan)', 'ban_depan', 'Ban depan IRC Tubeless 110/80-14 untuk ADV', true);
                $mapTire('Ban Luar IRC Ring 13 - 130/70 Tubeless (ADV 150 / 160 Belakang)', 'ban_belakang', 'Ban belakang IRC Tubeless 130/70-13 untuk ADV', true);
            }

            // ── PCX 160 ──
            // Depan: 110/70-14, Belakang: 130/70-13
            elseif ($isPcx160) {
                $mapTire('Ban Luar IRC Ring 14 - 110/70 Tubeless (PCX 160 Depan)', 'ban_depan', 'Ban depan IRC Tubeless 110/70-14 OEM PCX 160', true);
                $mapTire('Ban Luar IRC Ring 13 - 130/70 Tubeless (NMAX / PCX 160 Belakang)', 'ban_belakang', 'Ban belakang IRC Tubeless 130/70-13 untuk PCX 160', true);
            }

            // ── PCX 150 / Vario 160 ──
            // Depan: 100/80-14, Belakang: 120/70-14
            elseif ($isPcx150 || $isVario160) {
                $mapTire('Ban Luar IRC Ring 14 - 100/80 Tubeless (Vario 150 Belakang / PCX 150 Depan)', 'ban_depan', 'Ban depan IRC Tubeless 100/80-14 OEM PCX 150 / Vario 160', true);
                $mapTire('Ban Luar AHM Ring 14 - 100/80 Tubeless (Vario 150 / PCX 150 Belakang/Depan)', 'ban_depan', 'Ban depan AHM Tubeless 100/80-14 OEM PCX 150 / Vario 160');
                $mapTire('Ban Luar IRC Ring 14 - 120/70 Tubeless (PCX 150/160 / Vario 160 Belakang)', 'ban_belakang', 'Ban belakang IRC Tubeless 120/70-14 OEM PCX 150 / Vario 160', true);
            }

            // ── NMAX 155 (Ring 13) ──
            // Depan: 110/70-13, Belakang: 130/70-13
            elseif ($isNmax) {
                $mapTire('Ban Luar IRC Ring 13 - 110/70 Tubeless (NMAX Depan)', 'ban_depan', 'Ban depan IRC Tubeless 110/70-13 OEM NMAX', true);
                $mapTire('Ban Luar IRC Ring 13 - 130/70 Tubeless (NMAX / PCX 160 Belakang)', 'ban_belakang', 'Ban belakang IRC Tubeless 130/70-13 OEM NMAX', true);
            }

            // ── Aerox 155 ──
            // Depan: 110/80-14, Belakang: 140/70-14
            elseif ($isAerox) {
                $mapTire('Ban Luar IRC Ring 14 - 110/80 Tubeless (Aerox 155 Depan)', 'ban_depan', 'Ban depan IRC Tubeless 110/80-14 OEM Aerox 155', true);
                $mapTire('Ban Luar IRC Ring 14 - 140/70 Tubeless (Aerox 155 Belakang)', 'ban_belakang', 'Ban belakang IRC Tubeless 140/70-14 OEM Aerox 155', true);
            }

            // ── Lexi / FreeGo Ring 14 (Belakang: 100/90-14) ──
            elseif ($isLexi || $isFreego) {
                // Depan sama seperti matic standar 80/90-14 (Lexi) atau R12 (FreeGo)
                if ($isFreego) {
                    // FreeGo punya Ring 12
                    $mapTire('Ban Luar IRC Ring 12 - 110/70 Tubeless (Fazzio Depan & Belakang)', 'ban_depan', 'Ban depan IRC Tubeless 110/70-12 FreeGo', true);
                    $mapTire('Ban Luar IRC Ring 12 - 110/70 Tubeless (Fazzio Depan & Belakang)', 'ban_belakang', 'Ban belakang IRC Tubeless 110/70-12 FreeGo');
                } else {
                    $mapTire('Ban Luar IRC Ring 14 - 80/90 Tubeless (Beat / Vario Depan & MIO Belakang)', 'ban_depan', 'Ban depan IRC Tubeless 80/90-14 untuk Lexi', true);
                }
                $mapTire('Ban Luar IRC Ring 14 - 100/90 Tubeless (Lexi / Freego Belakang)', 'ban_belakang', 'Ban belakang IRC Tubeless 100/90-14 untuk Lexi/Freego', true);
            }

            // ── Retro Ring 12: Scoopy R12, Fazzio, Filano ──
            // Scoopy: Depan 100/90-12, Belakang 110/90-12
            // Fazzio/Filano: 110/70-12 (depan & belakang sama)
            elseif ($isRetroR12 && !$isFreego) {
                if ($isScoopyR12) {
                    $mapTire('Ban Luar IRC Ring 12 - 100/90 Tubeless (Scoopy Ring 12 Depan)', 'ban_depan', 'Ban depan IRC Tubeless 100/90-12 OEM Scoopy', true);
                    $mapTire('Ban Luar AHM Ring 12 - 100/90 Tubeless (Scoopy Ring 12 Depan)', 'ban_depan', 'Ban depan AHM Tubeless 100/90-12 OEM Scoopy');
                    $mapTire('Ban Luar IRC Ring 12 - 110/90 Tubeless (Scoopy Ring 12 Belakang)', 'ban_belakang', 'Ban belakang IRC Tubeless 110/90-12 OEM Scoopy', true);
                    $mapTire('Ban Luar AHM Ring 12 - 110/90 Tubeless (Scoopy Ring 12 Belakang)', 'ban_belakang', 'Ban belakang AHM Tubeless 110/90-12 OEM Scoopy');
                } else {
                    // Fazzio / Filano — ukuran depan & belakang sama (110/70-12)
                    // Karena product_id sama, kita map sebagai ban_depan saja agar tidak overwrite
                    $mapTire('Ban Luar IRC Ring 12 - 110/70 Tubeless (Fazzio Depan & Belakang)', 'ban_depan', 'Ban depan & belakang IRC Tubeless 110/70-12 OEM Fazzio/Filano (ukuran sama)', true);
                    // Tambah alternatif dari Scoopy yang bisa dipakai juga
                    $mapTire('Ban Luar IRC Ring 12 - 100/90 Tubeless (Scoopy Ring 12 Depan)', 'ban_depan', 'Ban depan IRC Tubeless 100/90-12 (alternatif)');
                    $mapTire('Ban Luar IRC Ring 12 - 110/90 Tubeless (Scoopy Ring 12 Belakang)', 'ban_belakang', 'Ban belakang IRC Tubeless 110/90-12 (alternatif)');
                }
            }

            // ── Vario 125 / Vario 150 (Ring 14 Mid) ──
            // Depan: 90/80-14, Belakang: 100/80-14
            elseif ($isVarioMid) {
                $mapTire('Ban Luar IRC Ring 14 - 90/80 Tubeless (Vario 125 Baru / 150 Depan)', 'ban_depan', 'Ban depan IRC Tubeless 90/80-14 OEM Vario 125/150', true);
                $mapTire('Ban Luar AHM Ring 14 - 90/80 Tubeless (Vario 125 Baru / Vario 150 Depan)', 'ban_depan', 'Ban depan AHM Tubeless 90/80-14 OEM Vario 125/150');
                $mapTire('Ban Luar IRC Ring 14 - 100/80 Tubeless (Vario 150 Belakang / PCX 150 Depan)', 'ban_belakang', 'Ban belakang IRC Tubeless 100/80-14 OEM Vario 125/150', true);
                $mapTire('Ban Luar AHM Ring 14 - 100/80 Tubeless (Vario 150 / PCX 150 Belakang/Depan)', 'ban_belakang', 'Ban belakang AHM Tubeless 100/80-14 OEM Vario 125/150');
                // Non-tubeless alternative
                $mapTire('Ban Luar IRC Ring 14 - 80/90 Non-Tubeless (Matic Ring 14)', 'ban_depan', 'Ban depan IRC Non-Tubeless 80/90-14 (alternatif velg ruji)');
                $mapTire('Ban Luar IRC Ring 14 - 90/90 Non-Tubeless (Matic Ring 14)', 'ban_belakang', 'Ban belakang IRC Non-Tubeless 90/90-14 (alternatif velg ruji)');
                // Ban Dalam
                $mapTire('Ban Dalam IRC Ring 14 - 80/90 (2.75-14) (Skutik Ring 14 Depan/Belakang)', 'ban_dalam_depan', 'Ban dalam depan IRC Ring 14 untuk Vario');
                $mapTire('Ban Dalam IRC Ring 14 - 90/90 (3.00-14) (Skutik Ring 14 Belakang)', 'ban_dalam_belakang', 'Ban dalam belakang IRC Ring 14 untuk Vario');
            }

            // ── Matic Standar Ring 14: Beat, Vario 110, Genio, Spacy, Mio, Fino, Nex, etc ──
            // Depan: 80/90-14, Belakang: 90/90-14
            elseif ($isMatic && !$isXmax) {
                // Tubeless IRC
                $mapTire('Ban Luar IRC Ring 14 - 80/90 Tubeless (Beat / Vario Depan & MIO Belakang)', 'ban_depan', 'Ban depan IRC Tubeless 80/90-14 standar matic R14', true);
                $mapTire('Ban Luar IRC Ring 14 - 90/90 Tubeless (Beat / Vario Belakang & MIO Depan)', 'ban_belakang', 'Ban belakang IRC Tubeless 90/90-14 standar matic R14', true);
                // Tubeless AHM (Honda)
                if ($isHonda) {
                    $mapTire('Ban Luar AHM Ring 14 - 80/90 Tubeless (Beat / Vario Depan)', 'ban_depan', 'Ban depan AHM Tubeless 80/90-14 OEM Honda matic');
                    $mapTire('Ban Luar AHM Ring 14 - 90/90 Tubeless (Beat / Vario Belakang)', 'ban_belakang', 'Ban belakang AHM Tubeless 90/90-14 OEM Honda matic');
                }
                // Tubeless IRC 70/90-14 (Mio series depan)
                if ($isYamaha && ($isMio || $isNex || $isAddress)) {
                    $mapTire('Ban Luar IRC Ring 14 - 70/90 Tubeless (MIO)', 'ban_depan', 'Ban depan IRC Tubeless 70/90-14 standar Mio/Fino/Nex');
                }
                // Non-tubeless alternatives
                $mapTire('Ban Luar IRC Ring 14 - 80/90 Non-Tubeless (Matic Ring 14)', 'ban_depan', 'Ban depan IRC Non-Tubeless 80/90-14 (velg ruji)');
                $mapTire('Ban Luar IRC Ring 14 - 90/90 Non-Tubeless (Matic Ring 14)', 'ban_belakang', 'Ban belakang IRC Non-Tubeless 90/90-14 (velg ruji)');
                if ($isHonda) {
                    $mapTire('Ban Luar AHM Ring 14 - 80/90 Non-Tubeless (Skutik Honda Depan (Beat / Vario / Spacy))', 'ban_depan', 'Ban depan AHM Non-Tubeless 80/90-14 (velg ruji)');
                    $mapTire('Ban Luar AHM Ring 14 - 90/90 Non-Tubeless (Skutik Honda Belakang (Beat / Vario / Spacy))', 'ban_belakang', 'Ban belakang AHM Non-Tubeless 90/90-14 (velg ruji)');
                }
                // Ban Dalam R14
                $mapTire('Ban Dalam IRC Ring 14 - 70/90 (2.50-14) (Skutik Ring 14 Depan)', 'ban_dalam_depan', 'Ban dalam depan IRC 70/90 Ring 14');
                $mapTire('Ban Dalam IRC Ring 14 - 80/90 (2.75-14) (Skutik Ring 14 Depan/Belakang)', 'ban_dalam_depan', 'Ban dalam depan IRC 80/90 Ring 14');
                $mapTire('Ban Dalam IRC Ring 14 - 90/90 (3.00-14) (Skutik Ring 14 Belakang)', 'ban_dalam_belakang', 'Ban dalam belakang IRC 90/90 Ring 14');
                $mapTire('Ban Dalam IRC Ring 14 - 2.75 / 3.00 (Skutik Ring 14 Lebar)', 'ban_dalam_belakang', 'Ban dalam belakang IRC Ring 14 lebar');
            }

            // ── Skywave / Skydrive Ring 16 ──
            elseif ($isSkywave || $isSpin) {
                $mapTire('Ban Luar IRC Ring 16 - 70/90 Non-Tubeless (Matic Ring 16 (Nouvo/Skywave))', 'ban_depan', 'Ban depan IRC Non-Tubeless 70/90-16 Skywave', true);
                $mapTire('Ban Luar IRC Ring 16 - 80/90 Non-Tubeless (Matic Ring 16 (Nouvo/Skywave))', 'ban_belakang', 'Ban belakang IRC Non-Tubeless 80/90-16 Skywave', true);
                // Ban Dalam R16
                $mapTire('Ban Dalam IRC Ring 16 - 70/90 (Skutik Ring 16 (Nouvo/Skywave))', 'ban_dalam_depan', 'Ban dalam depan IRC Ring 16');
                $mapTire('Ban Dalam IRC Ring 16 - 80/90 (Skutik Ring 16 (Nouvo/Skywave))', 'ban_dalam_belakang', 'Ban dalam belakang IRC Ring 16');
            }

            // ── Bebek Ring 17: Supra, Revo, Blade, Jupiter, Vega, Smash, Shogun ──
            // Depan: 70/90-17, Belakang: 80/90-17
            elseif ($isBebek) {
                // Tubeless IRC
                $mapTire('Ban Luar IRC Ring 17 - 70/90 Tubeless (Bebek Depan (Supra/Jupiter/Revo))', 'ban_depan', 'Ban depan IRC Tubeless 70/90-17 Bebek', true);
                $mapTire('Ban Luar IRC Ring 17 - 80/90 Tubeless (Bebek Belakang (Supra/Jupiter/Revo))', 'ban_belakang', 'Ban belakang IRC Tubeless 80/90-17 Bebek', true);
                // Non-tubeless IRC
                $mapTire('Ban Luar IRC Ring 17 - 70/90 Non-Tubeless (Bebek Ring 17)', 'ban_depan', 'Ban depan IRC Non-Tubeless 70/90-17 Bebek (velg ruji)');
                $mapTire('Ban Luar IRC Ring 17 - 80/90 Non-Tubeless (Bebek Ring 17)', 'ban_belakang', 'Ban belakang IRC Non-Tubeless 80/90-17 Bebek (velg ruji)');
                // AHM Non-tubeless (Honda)
                if ($isHonda) {
                    $mapTire('Ban Luar AHM Ring 17 - 70/90 (2.25) Non-Tubeless (Bebek Honda Depan (Supra / Revo / Blade))', 'ban_depan', 'Ban depan AHM Non-Tubeless 70/90-17 OEM Honda Bebek');
                    $mapTire('Ban Luar AHM Ring 17 - 80/90 (2.75) Non-Tubeless (Bebek Honda Belakang (Supra / Revo / Blade))', 'ban_belakang', 'Ban belakang AHM Non-Tubeless 80/90-17 OEM Honda Bebek');
                }
                // Non-tubeless IRC imperial sizes
                $mapTire('Ban Luar IRC Ring 17 - 2.25 Non-Tubeless (Bebek Ring 17)', 'ban_depan', 'Ban depan IRC Non-Tubeless 2.25-17 Bebek (alternatif)');
                $mapTire('Ban Luar IRC Ring 17 - 2.50 Non-Tubeless (Bebek Ring 17)', 'ban_depan', 'Ban depan IRC Non-Tubeless 2.50-17 Bebek');
                $mapTire('Ban Luar IRC Ring 17 - 2.75 Non-Tubeless (Bebek Ring 17)', 'ban_belakang', 'Ban belakang IRC Non-Tubeless 2.75-17 Bebek');
                if ($isHonda) {
                    $mapTire('Ban Luar AHM Ring 17 - 2.50 Non-Tubeless (Bebek Honda Standar)', 'ban_depan', 'Ban depan AHM Non-Tubeless 2.50-17 Bebek Honda');
                    $mapTire('Ban Luar AHM Ring 17 - 2.75 Non-Tubeless (Bebek Honda Belakang)', 'ban_belakang', 'Ban belakang AHM Non-Tubeless 2.75-17 Bebek Honda');
                }
                // Ban Dalam R17
                $mapTire('Ban Dalam IRC Ring 17 - 2.25 / 2.50 (70/90-17) (Bebek Ring 17 Depan)', 'ban_dalam_depan', 'Ban dalam depan IRC Ring 17 Bebek', true);
                $mapTire('Ban Dalam IRC Ring 17 - 2.50 / 2.75 (80/90-17) (Bebek Ring 17 Belakang)', 'ban_dalam_belakang', 'Ban dalam belakang IRC Ring 17 Bebek', true);
                $mapTire('Ban Dalam IRC Ring 17 - 2.75 (Bebek / Sport Ring 17)', 'ban_dalam_belakang', 'Ban dalam belakang IRC 2.75-17 Bebek/Sport');
            }

            // ── Sport Ring 17 ──
            elseif ($isSport) {
                // Honda Sport 150cc (CB150R, CBR150R, Sonic, CRF150L)
                // Depan: 100/80-17, Belakang: 130/70-17
                if ($isHonda && ($isCb150 || $isCbr150 || $isSonic || $isCrf150 || $isCb150x)) {
                    $mapTire('Ban Luar IRC Ring 17 - 100/80 Tubeless (CB150R / CBR 150R Depan)', 'ban_depan', 'Ban depan IRC Tubeless 100/80-17 Sport Honda 150', true);
                    $mapTire('Ban Luar IRC Ring 17 - 130/70 Tubeless (CB150R / CBR 150R Belakang)', 'ban_belakang', 'Ban belakang IRC Tubeless 130/70-17 Sport Honda 150', true);
                }
                // Honda Megapro / Verza
                // Depan: 80/100-17, Belakang: 100/90-17
                elseif ($isHonda && ($isMegapro || $isVerza)) {
                    $mapTire('Ban Luar IRC Ring 17 - 80/100 Tubeless (New Megapro / Verza Depan)', 'ban_depan', 'Ban depan IRC Tubeless 80/100-17 Megapro/Verza', true);
                    $mapTire('Ban Luar IRC Ring 17 - 100/90 Tubeless (New Megapro / Verza Belakang)', 'ban_belakang', 'Ban belakang IRC Tubeless 100/90-17 Megapro/Verza', true);
                }
                // Honda CBR250RR / CRF250Rally (ukurannya lebih besar, skip)
                elseif ($isHonda && ($isCbr250 || $isCrf250)) {
                    // Skip - ukuran lebih besar tidak ada di data saat ini
                }
                // Yamaha Vixion / R15 / MT-15 / XSR / Byson
                // Depan: 90/80-17, Belakang: 120/70-17 (Vixion) atau 130/70-17 (R15)
                elseif ($isYamaha && ($isVixion || $isR15 || $isMt15 || $isXsr || $isByson)) {
                    $mapTire('Ban Luar IRC Ring 17 - 90/80 Tubeless (Vixion Depan)', 'ban_depan', 'Ban depan IRC Tubeless 90/80-17 Sport Yamaha 155', true);
                    $mapTire('Ban Luar IRC Ring 17 - 120/70 Tubeless (Vixion Belakang)', 'ban_belakang', 'Ban belakang IRC Tubeless 120/70-17 Sport Yamaha', true);
                }
                // Yamaha WR155R (trail)
                elseif ($isYamaha && $isWr155) {
                    $mapTire('Ban Luar IRC Ring 17 - 80/100 Non-Tubeless (Sport / Trail)', 'ban_depan', 'Ban depan IRC Non-Tubeless 80/100-17 Trail');
                    $mapTire('Ban Luar IRC Ring 17 - 100/90 Non-Tubeless (Sport / Trail)', 'ban_belakang', 'Ban belakang IRC Non-Tubeless 100/90-17 Trail');
                }
                // Yamaha R25 / MT-25 (ukuran lebih besar, skip)
                elseif ($isYamaha && ($isR25 || $isMt25)) {
                    // Skip - ukuran lebih besar
                }
                // Suzuki Satria F150 / GSX-R150 / GSX-S150
                elseif ($isSuzuki && ($isSatria || $isGsx)) {
                    $mapTire('Ban Luar IRC Ring 17 - 90/80 Tubeless (Vixion Depan)', 'ban_depan', 'Ban depan IRC Tubeless 90/80-17 Sport Suzuki', true);
                    $mapTire('Ban Luar IRC Ring 17 - 130/70 Tubeless (CB150R / CBR 150R Belakang)', 'ban_belakang', 'Ban belakang IRC Tubeless 130/70-17 Sport Suzuki', true);
                }
                // Suzuki Thunder 125
                elseif ($isSuzuki && $isThunder) {
                    $mapTire('Ban Luar IRC Ring 17 - 90/80 Tubeless (Vixion Depan)', 'ban_depan', 'Ban depan IRC Tubeless 90/80-17 Thunder');
                    $mapTire('Ban Luar IRC Ring 17 - 120/70 Tubeless (Vixion Belakang)', 'ban_belakang', 'Ban belakang IRC Tubeless 120/70-17 Thunder');
                }
                // Kawasaki sport 150cc (Ninja 150RR, KLX 150, D-Tracker)
                elseif ($isKawasaki && ($isKlx || $isDtracker)) {
                    // KLX/D-Tracker menggunakan trail tire
                    $mapTire('Ban Luar IRC Ring 17 - 80/100 Non-Tubeless (Sport / Trail)', 'ban_depan', 'Ban depan IRC Non-Tubeless 80/100-17 KLX/D-Tracker');
                    $mapTire('Ban Luar IRC Ring 17 - 100/90 Non-Tubeless (Sport / Trail)', 'ban_belakang', 'Ban belakang IRC Non-Tubeless 100/90-17 KLX/D-Tracker');
                }
                elseif ($isKawasaki && $isW175) {
                    // W175 menggunakan ban Ring 18
                    $mapTire('Ban Luar IRC Ring 18 - 2.75 Non-Tubeless (Sport Ring 18)', 'ban_depan', 'Ban depan IRC Non-Tubeless 2.75-18 W175', true);
                    $mapTire('Ban Luar IRC Ring 18 - 3.00 Non-Tubeless (Sport Ring 18)', 'ban_belakang', 'Ban belakang IRC Non-Tubeless 3.00-18 W175', true);
                    $mapTire('Ban Dalam IRC Ring 18 - 2.25 / 2.50 (Sport Ring 18)', 'ban_dalam_depan', 'Ban dalam depan IRC Ring 18 W175');
                    $mapTire('Ban Dalam IRC Ring 18 - 2.75 / 3.00 (Sport Ring 18)', 'ban_dalam_belakang', 'Ban dalam belakang IRC Ring 18 W175');
                }
                elseif ($isKawasaki && $isNinja) {
                    // Ninja 250: ban standarnya lebih besar, tapi 100/80-17 & 130/70-17 bisa pakai
                    $mapTire('Ban Luar IRC Ring 17 - 100/80 Tubeless (CB150R / CBR 150R Depan)', 'ban_depan', 'Ban depan IRC Tubeless 100/80-17 Ninja');
                    $mapTire('Ban Luar IRC Ring 17 - 130/70 Tubeless (CB150R / CBR 150R Belakang)', 'ban_belakang', 'Ban belakang IRC Tubeless 130/70-17 Ninja');
                }
                // Generic sport fallback
                else {
                    $mapTire('Ban Luar IRC Ring 17 - 90/80 Tubeless (Vixion Depan)', 'ban_depan', 'Ban depan IRC Tubeless 90/80-17 Sport');
                    $mapTire('Ban Luar IRC Ring 17 - 130/70 Tubeless (CB150R / CBR 150R Belakang)', 'ban_belakang', 'Ban belakang IRC Tubeless 130/70-17 Sport');
                }

                // Non-tubeless sport R17 (all sport get these as alternatives)
                $mapTire('Ban Luar IRC Ring 17 - 3.00 Non-Tubeless (Sport / Bebek)', 'ban_depan', 'Ban depan IRC Non-Tubeless 3.00-17 Sport (alternatif)');
                $mapTire('Ban Luar IRC Ring 17 - 90/90 Non-Tubeless (Sport / Bebek)', 'ban_belakang', 'Ban belakang IRC Non-Tubeless 90/90-17 Sport (alternatif)');

                // Ban Dalam R17 (for non-tubeless setups)
                $mapTire('Ban Dalam IRC Ring 17 - 2.75 (Bebek / Sport Ring 17)', 'ban_dalam_depan', 'Ban dalam depan IRC 2.75-17 Sport');
                $mapTire('Ban Dalam IRC Ring 17 - 3.00 (Sport Ring 17)', 'ban_dalam_belakang', 'Ban dalam belakang IRC 3.00-17 Sport');
            }
        }
    }
}
