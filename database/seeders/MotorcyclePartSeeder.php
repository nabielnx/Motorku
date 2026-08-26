<?php

namespace Database\Seeders;

use App\Models\Motorcycle;
use App\Models\MotorcyclePart;
use App\Models\Product;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class MotorcyclePartSeeder extends Seeder
{
    public function run(): void
    {
        // Clear existing mappings
        DB::table('motorcycle_parts')->truncate();

        $motorcycles = Motorcycle::all();
        $products = Product::all()->keyBy('sku');

        if ($motorcycles->isEmpty() || $products->isEmpty()) {
            return;
        }

        foreach ($motorcycles as $motor) {
            $brand = strtolower($motor->brand);
            $type = strtolower($motor->engine_type);
            $model = strtolower($motor->model);

            $isHonda = ($brand === 'honda');
            $isYamaha = ($brand === 'yamaha');
            $isSuzuki = ($brand === 'suzuki');

            $isMatic = ($type === 'matic');
            $isBebek = ($type === 'bebek');
            $isSport = ($type === 'sport');
            $isManual = ($isBebek || $isSport);

            // Specific Model Subtypes
            $isNmax = str_contains($model, 'nmax');
            $isAerox = str_contains($model, 'aerox');
            $isPcx160 = str_contains($model, 'pcx 160');
            $isPcx150 = str_contains($model, 'pcx 150') || (str_contains($model, 'pcx') && !$isPcx160);
            $isVario160 = str_contains($model, 'vario 160');
            $isVarioMid = str_contains($model, 'vario 125') || str_contains($model, 'vario 150');
            $isVario110 = str_contains($model, 'vario 110');
            $isBeat = str_contains($model, 'beat');
            $isScoopyR12 = str_contains($model, 'scoopy') && !str_contains($model, 'karbu') && !str_contains($model, 'fi (lama)');
            $isScoopyR14 = str_contains($model, 'scoopy') && (str_contains($model, 'karbu') || str_contains($model, 'fi (lama)'));
            $isGenio = str_contains($model, 'genio');
            $isFazzio = str_contains($model, 'fazzio') || str_contains($model, 'filano') || str_contains($model, 'freego');
            $isMio = str_contains($model, 'mio') || str_contains($model, 'fino') || str_contains($model, 'soul') || str_contains($model, 'gear');
            
            $isRetroR12 = $isScoopyR12 || $isFazzio;
            $isMaticR14Std = $isMatic && !$isNmax && !$isAerox && !$isPcx160 && !$isPcx150 && !$isVario160 && !$isVarioMid && !$isRetroR12;

            $isSupra = str_contains($model, 'supra');
            $isRevo = str_contains($model, 'revo') || str_contains($model, 'blade');
            $isJupiter = str_contains($model, 'jupiter') || str_contains($model, 'vega');
            $isMx = str_contains($model, 'mx king') || str_contains($model, 'jupiter mx');

            $isCb150 = str_contains($model, 'cb150') || str_contains($model, 'cbr150') || str_contains($model, 'sonic') || str_contains($model, 'verza') || str_contains($model, 'megapro') || str_contains($model, 'crf150');
            $isVixion = str_contains($model, 'vixion') || str_contains($model, 'r15') || str_contains($model, 'mt-15') || str_contains($model, 'xsr') || str_contains($model, 'byson');

            $hasRadiator = ($isHonda && ($isVario160 || $isVarioMid || $isPcx160 || $isPcx150 || str_contains($model, 'adv') || $isCb150 || str_contains($model, 'gtr')))
                || ($isYamaha && ($isNmax || $isAerox || str_contains($model, 'lexi') || $isVixion || $isMx))
                || ($isSuzuki && str_contains($model, 'gsx'));

            // Helper closure to map product to this motorcycle
            $map = function (string $sku, string $category, string $notes, bool $isRecommended = false) use ($motor, $products) {
                if (isset($products[$sku])) {
                    MotorcyclePart::create([
                        'motorcycle_id' => $motor->id,
                        'product_id' => $products[$sku]->id,
                        'part_category' => $category,
                        'notes' => $notes,
                        'is_recommended' => $isRecommended,
                    ]);
                }
            };

            // =================================================================
            // 1. PELUMAS & CAIRAN
            // =================================================================
            // --- Oli Mesin ---
            if ($isHonda && $isMatic) {
                $map('OLI-001', 'oli_mesin', 'Oli matic standar original AHM Oil MPX2 0.8L', true);
                $map('OLI-002', 'oli_mesin', 'Oli matic full synthetic premium AHM Oil SPX2 0.8L');
                $map('OLI-010', 'oli_mesin', 'Oli matic berkualitas Astra Aspira Oil 10W-30');
            } elseif ($isHonda && $isBebek) {
                $map('OLI-003', 'oli_mesin', 'Oli mesin bebek standar original AHM Oil MPX1 0.8L', true);
                $map('OLI-011', 'oli_mesin', 'Oli mesin 4T berkualitas Astra Aspira Oil 20W-50');
            } elseif ($isHonda && $isSport) {
                $map('OLI-004', 'oli_mesin', 'Oli mesin sport standar original AHM Oil MPX1 1.0L', true);
                $map('OLI-005', 'oli_mesin', 'Oli mesin sport full synthetic AHM Oil SPX1 1.0L');
                $map('OLI-011', 'oli_mesin', 'Oli mesin 4T berkualitas Astra Aspira Oil 20W-50');
            } elseif ($isYamaha && $isMatic) {
                if ($isNmax || $isAerox) {
                    $map('OLI-007', 'oli_mesin', 'Oli mesin maxi matic Yamalube Super Matic Full Syn 1.0L', true);
                } else {
                    $map('OLI-006', 'oli_mesin', 'Oli mesin matic Yamalube Power Matic 0.8L', true);
                }
                $map('OLI-010', 'oli_mesin', 'Oli matic berkualitas Astra Aspira Oil 10W-30');
            } elseif ($isYamaha && $isBebek) {
                $map('OLI-008', 'oli_mesin', 'Oli mesin bebek original Yamalube Silver 0.8L', true);
                $map('OLI-011', 'oli_mesin', 'Oli mesin 4T berkualitas Astra Aspira Oil 20W-50');
            } elseif ($isYamaha && $isSport) {
                $map('OLI-009', 'oli_mesin', 'Oli mesin sport original Yamalube Sport 1.0L', true);
                $map('OLI-011', 'oli_mesin', 'Oli mesin 4T berkualitas Astra Aspira Oil 20W-50');
            } elseif ($isSuzuki) {
                if ($isMatic) {
                    $map('OLI-010', 'oli_mesin', 'Oli matic berkualitas Astra Aspira Oil 10W-30', true);
                    $map('OLI-001', 'oli_mesin', 'Oli mesin matic AHM MPX2 0.8L');
                } else {
                    $map('OLI-011', 'oli_mesin', 'Oli mesin 4T berkualitas Astra Aspira Oil 20W-50', true);
                }
            }

            // --- Oli Gardan (HANYA MOTOR MATIC) ---
            if ($isMatic) {
                if ($isHonda) {
                    $map('OLI-012', 'oli_gardan', 'Oli transmisi matic original Honda AHM 120ml', true);
                    $map('OLI-015', 'oli_gardan', 'Oli transmisi matic Astra Aspira 120ml');
                } elseif ($isYamaha) {
                    if ($isNmax || $isAerox) {
                        $map('OLI-014', 'oli_gardan', 'Oli transmisi maxi matic Yamalube 150ml', true);
                    } else {
                        $map('OLI-013', 'oli_gardan', 'Oli transmisi matic Yamalube 100ml', true);
                    }
                    $map('OLI-015', 'oli_gardan', 'Oli transmisi matic Astra Aspira 120ml');
                } else {
                    $map('OLI-015', 'oli_gardan', 'Oli transmisi matic Astra Aspira 120ml', true);
                }
            }

            // --- Minyak Rem ---
            if ($isHonda) {
                $map('OLI-016', 'minyak_rem', 'Minyak rem DOT 4 original Honda AHM 150ml', true);
                $map('OLI-018', 'minyak_rem', 'Minyak rem DOT 3 Astra Aspira 50ml');
            } elseif ($isYamaha) {
                $map('OLI-017', 'minyak_rem', 'Minyak rem DOT 4 original Yamalube 50ml', true);
                $map('OLI-018', 'minyak_rem', 'Minyak rem DOT 3 Astra Aspira 50ml');
            } else {
                $map('OLI-018', 'minyak_rem', 'Minyak rem DOT 3 Astra Aspira 50ml', true);
            }

            // --- Air Radiator / Coolant (HANYA MOTOR RADIATOR) ---
            if ($hasRadiator) {
                if ($isHonda) {
                    $map('FLT-010', 'coolant', 'Air radiator coolant original Honda AHM 500ml', true);
                    $map('FLT-012', 'coolant', 'Air radiator coolant Astra Aspira 1 Liter');
                } elseif ($isYamaha) {
                    $map('FLT-011', 'coolant', 'Air radiator coolant original Yamacoolant 900ml', true);
                    $map('FLT-012', 'coolant', 'Air radiator coolant Astra Aspira 1 Liter');
                } else {
                    $map('FLT-012', 'coolant', 'Air radiator coolant Astra Aspira 1 Liter', true);
                }
            }

            // =================================================================
            // 2. KAKI-KAKI & RODA (BAN: HANYA IRC & FEDERAL AHM)
            // =================================================================
            // --- Ban Depan & Ban Belakang ---
            if ($isRetroR12) {
                // Ring 12 (Scoopy R12, Fazzio, Filano, FreeGo)
                $map('BAN-D12-001', 'ban_depan', 'Ban depan Federal AHM 100/90-12 Tubeless', $isHonda);
                $map('BAN-D12-002', 'ban_depan', 'Ban depan IRC NR90 100/90-12 Tubeless', $isYamaha);
                $map('BAN-B12-001', 'ban_belakang', 'Ban belakang Federal AHM 110/90-12 Tubeless', $isHonda);
                $map('BAN-B12-002', 'ban_belakang', 'Ban belakang IRC NR90 110/90-12 Tubeless', $isYamaha);
            } elseif ($isNmax) {
                // Ring 13 (NMAX 155)
                $map('BAN-D13-001', 'ban_depan', 'Ban depan IRC SS-560F 110/70-13 Tubeless OEM NMAX', true);
                $map('BAN-B13-001', 'ban_belakang', 'Ban belakang IRC SS-560R 130/70-13 Tubeless OEM NMAX', true);
            } elseif ($isVarioMid || $isVario160 || $isPcx150 || $isPcx160 || $isAerox) {
                // Ring 14 Mid & Wide (Vario 125/150/160, Aerox, PCX)
                $map('BAN-D14-007', 'ban_depan', 'Ban depan Federal AHM FT235 90/80-14 Tubeless', $isHonda);
                $map('BAN-D14-008', 'ban_depan', 'Ban depan IRC Exato NR88 90/80-14 Tubeless', $isYamaha);
                $map('BAN-B14-007', 'ban_belakang', 'Ban belakang Federal AHM FT235 100/80-14 Tubeless', $isHonda);
                $map('BAN-B14-008', 'ban_belakang', 'Ban belakang IRC Exato NR88 100/80-14 Tubeless', $isYamaha);
            } elseif ($isMatic) {
                // Ring 14 Standar Matic (Beat, Vario 110, Mio M3, Fino, Gear, Nex)
                $map('BAN-D14-001', 'ban_depan', 'Ban depan Federal AHM FT235 80/90-14 Tubeless', $isHonda);
                $map('BAN-D14-002', 'ban_depan', 'Ban depan IRC Enviro NR91 80/90-14 Tubeless', $isYamaha);
                $map('BAN-D14-003', 'ban_depan', 'Ban depan Federal AHM 80/90-14 Tubetype');
                $map('BAN-D14-004', 'ban_depan', 'Ban depan IRC NR73 70/90-14 Tubetype');
                $map('BAN-B14-001', 'ban_belakang', 'Ban belakang Federal AHM FT235 90/90-14 Tubeless', $isHonda);
                $map('BAN-B14-002', 'ban_belakang', 'Ban belakang IRC Enviro NR91 90/90-14 Tubeless', $isYamaha);
                $map('BAN-B14-003', 'ban_belakang', 'Ban belakang Federal AHM 90/90-14 Tubetype');
                $map('BAN-B14-004', 'ban_belakang', 'Ban belakang IRC NR73 80/90-14 Tubetype');
                // Ban Dalam R14
                $map('BDL-14-001', 'ban_dalam_depan', 'Ban dalam depan Federal AHM Ring 14', $isHonda);
                $map('BDL-14-002', 'ban_dalam_depan', 'Ban dalam depan IRC Ring 14', $isYamaha);
                $map('BDL-14-003', 'ban_dalam_belakang', 'Ban dalam belakang Federal AHM Ring 14', $isHonda);
                $map('BDL-14-004', 'ban_dalam_belakang', 'Ban dalam belakang IRC Ring 14', $isYamaha);
            } elseif ($isBebek) {
                // Ring 17 Bebek (Supra X 125, Revo, Jupiter Z1, Vega)
                $map('BAN-D17-001', 'ban_depan', 'Ban depan Federal AHM FT235 70/90-17 Tubetype OEM Bebek', $isHonda);
                $map('BAN-D17-002', 'ban_depan', 'Ban depan IRC NR73 70/90-17 Tubetype Bebek', $isYamaha);
                $map('BAN-B17-001', 'ban_belakang', 'Ban belakang Federal AHM FT235 80/90-17 Tubetype OEM Bebek', $isHonda);
                $map('BAN-B17-002', 'ban_belakang', 'Ban belakang IRC NR73 80/90-17 Tubetype Bebek', $isYamaha);
                // Ban Dalam R17
                $map('BDL-17-001', 'ban_dalam_depan', 'Ban dalam depan Federal AHM Ring 17', $isHonda);
                $map('BDL-17-002', 'ban_dalam_depan', 'Ban dalam depan IRC Ring 17', $isYamaha);
                $map('BDL-17-003', 'ban_dalam_belakang', 'Ban dalam belakang Federal AHM Ring 17', $isHonda);
                $map('BDL-17-004', 'ban_dalam_belakang', 'Ban dalam belakang IRC Ring 17', $isYamaha);
            } elseif ($isSport) {
                // Ring 17 Sport (CB150R, CBR150R, Vixion, R15)
                $map('BAN-D17-005', 'ban_depan', 'Ban depan Federal AHM FT297 90/80-17 Tubeless Sport', $isHonda);
                $map('BAN-D17-006', 'ban_depan', 'Ban depan IRC RX-01F 90/80-17 Tubeless Sport', $isYamaha);
                $map('BAN-B17-005', 'ban_belakang', 'Ban belakang Federal AHM FT297 130/70-17 Tubeless Sport', $isHonda);
                $map('BAN-B17-006', 'ban_belakang', 'Ban belakang IRC RX-01R 130/70-17 Tubeless Sport', $isYamaha);
            }

            // --- Bearing / Laher Roda ---
            if ($isHonda) {
                $map('KK-BRG-001', 'bearing_roda', 'Bearing laher roda depan original Honda AHM 6201', true);
                $map('KK-BRG-003', 'bearing_roda', 'Bearing laher roda Astra Aspira 6201 RS');
            } elseif ($isYamaha) {
                $map('KK-BRG-002', 'bearing_roda', 'Bearing laher roda depan original Yamaha YGP 6300', true);
                $map('KK-BRG-003', 'bearing_roda', 'Bearing laher roda Astra Aspira 6201 RS');
            } else {
                $map('KK-BRG-003', 'bearing_roda', 'Bearing laher roda Astra Aspira 6201 RS', true);
            }

            // --- Velg ---
            if ($isHonda && ($isBeat || $isScoopyR14 || $isVario110)) {
                $map('KK-VLG-001', 'velg', 'Velg racing palang depan original Honda Beat', true);
                $map('KK-VLG-002', 'velg', 'Velg racing palang belakang original Honda Beat');
                $map('KK-VLG-005', 'velg', 'Velg jari-jari Astra Aspira Ring 14x1.40');
            } elseif ($isYamaha && ($isMio || $isFazzio)) {
                $map('KK-VLG-003', 'velg', 'Velg racing palang depan original Yamaha Mio M3', true);
                $map('KK-VLG-005', 'velg', 'Velg jari-jari Astra Aspira Ring 14x1.40');
            } elseif ($isBebek) {
                if ($isHonda) {
                    $map('KK-VLG-004', 'velg', 'Velg racing palang depan original Honda Supra X 125', true);
                }
                $map('KK-VLG-006', 'velg', 'Velg jari-jari Astra Aspira Ring 17x1.40', $isYamaha);
            }

            // --- Shockbreaker Depan ---
            if ($isHonda && $isMatic) {
                $map('KK-SHK-001', 'shockbreaker_depan', 'Pipa as shock depan original Honda AHM Beat/Scoopy/Vario 110', true);
                $map('KK-SHK-007', 'shockbreaker_depan', 'Pipa as shock depan Astra Aspira Beat/Vario 110');
            } elseif ($isHonda && $isBebek) {
                $map('KK-SHK-002', 'shockbreaker_depan', 'Pipa as shock depan original Honda AHM Supra X 125/Revo', true);
                $map('KK-SHK-008', 'shockbreaker_depan', 'Pipa as shock depan Astra Aspira Supra X 125/Revo');
            } elseif ($isHonda && $isSport) {
                $map('KK-SHK-003', 'shockbreaker_depan', 'Pipa as shock depan original Honda AHM CB150R', true);
            } elseif ($isYamaha && $isMatic) {
                $map('KK-SHK-004', 'shockbreaker_depan', 'Pipa as shock depan original Yamaha YGP Mio M3/Fino', true);
                $map('KK-SHK-009', 'shockbreaker_depan', 'Pipa as shock depan Astra Aspira Mio');
            } elseif ($isYamaha && $isBebek) {
                $map('KK-SHK-005', 'shockbreaker_depan', 'Pipa as shock depan original Yamaha YGP Jupiter Z1/Vega', true);
                $map('KK-SHK-009', 'shockbreaker_depan', 'Pipa as shock depan Astra Aspira Jupiter Z');
            } elseif ($isYamaha && $isSport) {
                $map('KK-SHK-006', 'shockbreaker_depan', 'Pipa as shock depan original Yamaha YGP Vixion', true);
            }

            // --- Shockbreaker Belakang ---
            if ($isHonda && $isMatic) {
                if ($isVarioMid || $isVario160) {
                    $map('KK-SHK-011', 'shockbreaker_belakang', 'Shockbreaker belakang original Honda AHM Vario 125/150 330mm', true);
                } else {
                    $map('KK-SHK-010', 'shockbreaker_belakang', 'Shockbreaker belakang original Honda AHM Beat/Scoopy 300mm', true);
                }
                $map('KK-SHK-018', 'shockbreaker_belakang', 'Shockbreaker belakang Astra Aspira Beat ESP 300mm');
            } elseif ($isHonda && $isBebek) {
                $map('KK-SHK-012', 'shockbreaker_belakang', 'Shockbreaker belakang ganda original Honda AHM Supra X 125 340mm', true);
                $map('KK-SHK-019', 'shockbreaker_belakang', 'Shockbreaker belakang ganda Astra Aspira Supra X 125 340mm');
            } elseif ($isHonda && $isSport) {
                $map('KK-SHK-013', 'shockbreaker_belakang', 'Monoshock belakang pro-link original Honda AHM CB150R', true);
            } elseif ($isYamaha && $isMatic) {
                if ($isNmax) {
                    $map('KK-SHK-015', 'shockbreaker_belakang', 'Shockbreaker belakang ganda original Yamaha YGP NMAX 155', true);
                } else {
                    $map('KK-SHK-014', 'shockbreaker_belakang', 'Shockbreaker belakang single original Yamaha YGP Mio M3 300mm', true);
                }
            } elseif ($isYamaha && $isBebek) {
                $map('KK-SHK-016', 'shockbreaker_belakang', 'Shockbreaker belakang ganda original Yamaha YGP Jupiter Z1 280mm', true);
                $map('KK-SHK-020', 'shockbreaker_belakang', 'Shockbreaker belakang ganda Astra Aspira Jupiter Z 280mm');
            } elseif ($isYamaha && $isSport) {
                $map('KK-SHK-017', 'shockbreaker_belakang', 'Monoshock belakang original Yamaha YGP Vixion', true);
            }

            // --- Seal Shockbreaker ---
            if ($isHonda) {
                $map('KK-SEL-001', 'seal_shock', 'Seal shock depan + dust seal original Honda AHM', true);
                $map('KK-SEL-003', 'seal_shock', 'Seal shock depan karet NBR Astra Aspira');
            } elseif ($isYamaha) {
                $map('KK-SEL-002', 'seal_shock', 'Seal shock depan + dust seal original Yamaha YGP', true);
                $map('KK-SEL-003', 'seal_shock', 'Seal shock depan karet NBR Astra Aspira');
            } else {
                $map('KK-SEL-003', 'seal_shock', 'Seal shock depan karet NBR Astra Aspira', true);
            }

            // =================================================================
            // 3. PENGEREMAN
            // =================================================================
            // --- Kampas Rem Depan / Cakram ---
            if ($isHonda && $isMatic) {
                $map('REM-001', 'kampas_rem_depan', 'Kampas rem cakram depan original Honda AHM Beat/Vario/Scoopy', true);
                $map('REM-007', 'kampas_rem_depan', 'Kampas rem cakram depan Astra Aspira Honda Matic');
            } elseif ($isHonda && $isBebek) {
                $map('REM-002', 'kampas_rem_depan', 'Kampas rem cakram depan original Honda AHM Supra X 125/Revo', true);
                $map('REM-007', 'kampas_rem_depan', 'Kampas rem cakram depan Astra Aspira Honda Bebek');
            } elseif ($isHonda && $isSport) {
                $map('REM-003', 'kampas_rem_depan', 'Kampas rem cakram depan original Honda AHM CB150R/CBR150R', true);
                $map('REM-007', 'kampas_rem_depan', 'Kampas rem cakram depan Astra Aspira');
            } elseif ($isYamaha && $isMatic) {
                if ($isNmax || $isAerox) {
                    $map('REM-006', 'kampas_rem_depan', 'Kampas rem cakram depan original Yamaha YGP NMAX/Aerox', true);
                } else {
                    $map('REM-004', 'kampas_rem_depan', 'Kampas rem cakram depan original Yamaha YGP Mio M3/Fino', true);
                }
                $map('REM-008', 'kampas_rem_depan', 'Kampas rem cakram depan Astra Aspira Yamaha Matic');
            } elseif ($isYamaha && $isBebek) {
                $map('REM-005', 'kampas_rem_depan', 'Kampas rem cakram depan original Yamaha YGP Jupiter Z1/Vega', true);
                $map('REM-008', 'kampas_rem_depan', 'Kampas rem cakram depan Astra Aspira Yamaha Bebek');
            } elseif ($isYamaha && $isSport) {
                $map('REM-006', 'kampas_rem_depan', 'Kampas rem cakram depan original Yamaha YGP Vixion/R15', true);
                $map('REM-008', 'kampas_rem_depan', 'Kampas rem cakram depan Astra Aspira');
            }

            // --- Kampas Rem Belakang / Tromol & Cakram ---
            if ($isHonda && $isMatic) {
                $map('REM-009', 'kampas_rem_belakang', 'Kampas rem tromol belakang original Honda AHM Beat/Vario/Scoopy', true);
                $map('REM-013', 'kampas_rem_belakang', 'Kampas rem tromol belakang Astra Aspira Honda Matic');
            } elseif ($isHonda && $isBebek) {
                $map('REM-009', 'kampas_rem_belakang', 'Kampas rem tromol belakang original Honda AHM Supra X 125/Revo', true);
                $map('REM-010', 'kampas_rem_belakang', 'Kampas rem cakram belakang original Honda AHM Supra X 125 Double Disk');
                $map('REM-013', 'kampas_rem_belakang', 'Kampas rem tromol belakang Astra Aspira Honda Bebek');
            } elseif ($isHonda && $isSport) {
                $map('REM-010', 'kampas_rem_belakang', 'Kampas rem cakram belakang original Honda AHM CB150R/CBR150R', true);
            } elseif ($isYamaha && $isMatic) {
                if ($isNmax) {
                    $map('REM-012', 'kampas_rem_belakang', 'Kampas rem cakram belakang original Yamaha YGP NMAX 155', true);
                } else {
                    $map('REM-011', 'kampas_rem_belakang', 'Kampas rem tromol belakang original Yamaha YGP Mio M3/Aerox', true);
                    $map('REM-014', 'kampas_rem_belakang', 'Kampas rem tromol belakang Astra Aspira Yamaha Matic');
                }
            } elseif ($isYamaha && $isBebek) {
                $map('REM-011', 'kampas_rem_belakang', 'Kampas rem tromol belakang original Yamaha YGP Jupiter Z1/Vega', true);
                $map('REM-014', 'kampas_rem_belakang', 'Kampas rem tromol belakang Astra Aspira Yamaha Bebek');
            } elseif ($isYamaha && $isSport) {
                $map('REM-012', 'kampas_rem_belakang', 'Kampas rem cakram belakang original Yamaha YGP Vixion/R15', true);
            }

            // --- Piringan Cakram Depan ---
            if ($isHonda && $isMatic) {
                $map('REM-015', 'piringan_cakram', 'Piringan cakram depan original Honda AHM Beat/Scoopy/Vario', true);
                $map('REM-021', 'piringan_cakram', 'Piringan cakram depan Astra Aspira Beat/Vario');
            } elseif ($isHonda && $isBebek) {
                $map('REM-016', 'piringan_cakram', 'Piringan cakram depan original Honda AHM Supra X 125/Revo', true);
                $map('REM-022', 'piringan_cakram', 'Piringan cakram depan Astra Aspira Supra X 125/Revo');
            } elseif ($isHonda && $isSport) {
                $map('REM-017', 'piringan_cakram', 'Piringan cakram depan 276mm original Honda AHM CB150R', true);
            } elseif ($isYamaha && $isMatic) {
                if ($isNmax) {
                    $map('REM-020', 'piringan_cakram', 'Piringan cakram depan original Yamaha YGP NMAX 155', true);
                } else {
                    $map('REM-018', 'piringan_cakram', 'Piringan cakram depan original Yamaha YGP Mio M3/Fino', true);
                    $map('REM-023', 'piringan_cakram', 'Piringan cakram depan Astra Aspira Mio');
                }
            } elseif ($isYamaha && $isBebek) {
                $map('REM-019', 'piringan_cakram', 'Piringan cakram depan original Yamaha YGP Jupiter Z1/Vega', true);
                $map('REM-023', 'piringan_cakram', 'Piringan cakram depan Astra Aspira Jupiter Z');
            } elseif ($isYamaha && $isSport) {
                $map('REM-020', 'piringan_cakram', 'Piringan cakram depan original Yamaha YGP Vixion/R15', true);
            }

            // --- Master Rem ---
            if ($isHonda && $isMatic) {
                $map('REM-024', 'master_rem', 'Master rem atas hidrolik original Honda AHM Beat/Scoopy/Vario', true);
                $map('REM-030', 'master_rem', 'Master rem kit piston repair kit Astra Aspira Beat/Vario');
            } elseif ($isHonda && $isBebek) {
                $map('REM-025', 'master_rem', 'Master rem atas hidrolik original Honda AHM Supra X 125/Revo', true);
                $map('REM-031', 'master_rem', 'Master rem kit piston repair kit Astra Aspira Supra X 125/Revo');
            } elseif ($isHonda && $isSport) {
                $map('REM-026', 'master_rem', 'Master rem atas hidrolik original Honda AHM CB150R', true);
            } elseif ($isYamaha && $isMatic) {
                $map('REM-027', 'master_rem', 'Master rem atas hidrolik original Yamaha YGP Mio M3/Fino', true);
                $map('REM-032', 'master_rem', 'Master rem kit piston repair kit Astra Aspira Mio');
            } elseif ($isYamaha && $isBebek) {
                $map('REM-028', 'master_rem', 'Master rem atas hidrolik original Yamaha YGP Jupiter Z1/Vega', true);
                $map('REM-032', 'master_rem', 'Master rem kit piston repair kit Astra Aspira Jupiter Z');
            } elseif ($isYamaha && $isSport) {
                $map('REM-029', 'master_rem', 'Master rem atas hidrolik original Yamaha YGP Vixion/R15', true);
            }

            // --- Kabel Rem Belakang (HANYA MOTOR MATIC TROMOL) ---
            if ($isMatic) {
                if ($isHonda) {
                    if ($isVarioMid) {
                        $map('REM-034', 'kabel_rem', 'Kabel rem belakang tromol original Honda AHM Vario 125/150', true);
                    } else {
                        $map('REM-033', 'kabel_rem', 'Kabel rem belakang tromol original Honda AHM Beat/Scoopy', true);
                    }
                    $map('REM-037', 'kabel_rem', 'Kabel rem belakang Astra Aspira Beat/Scoopy');
                } elseif ($isYamaha && !$isNmax) {
                    if (str_contains($model, 'karbu') || str_contains($model, 'smile')) {
                        $map('REM-036', 'kabel_rem', 'Kabel rem belakang original Yamaha YGP Mio Karbu', true);
                    } else {
                        $map('REM-035', 'kabel_rem', 'Kabel rem belakang original Yamaha YGP Mio M3/Fino', true);
                    }
                    $map('REM-038', 'kabel_rem', 'Kabel rem belakang Astra Aspira Mio/Fino');
                }
            }

            // =================================================================
            // 4. PENGGERAK & TRANSMISI (CVT VS RANTAI/KOPLING)
            // =================================================================
            if ($isMatic) {
                // --- V-Belt, Roller, Per CVT, Kampas Ganda KHUSUS MATIC ---
                if ($isHonda) {
                    if ($isVarioMid) {
                        $map('CVT-002', 'v_belt', 'V-Belt original Honda AHM (K35) Vario 125/150', true);
                        $map('CVT-008', 'v_belt', 'V-Belt Kit + Roller Astra Aspira Vario 125');
                        $map('CVT-011', 'roller', 'Roller weight 11g original Honda AHM Vario 125', true);
                        $map('CVT-017', 'per_cvt', 'Per CVT original Honda AHM Vario 125/150', true);
                        $map('CVT-023', 'kampas_ganda', 'Kampas ganda original Honda AHM Vario 125/150', true);
                    } elseif ($isPcx160 || $isVario160 || str_contains($model, 'adv 160')) {
                        $map('CVT-003', 'v_belt', 'V-Belt original Honda AHM (K1Z) PCX 160/Vario 160', true);
                    } else {
                        // Beat, Scoopy, Genio, Vario 110
                        $map('CVT-001', 'v_belt', 'V-Belt original Honda AHM (K44) Beat ESP/Scoopy/Genio', true);
                        $map('CVT-007', 'v_belt', 'V-Belt Kit + Roller Astra Aspira Beat ESP');
                        $map('CVT-010', 'roller', 'Roller weight 8.5g original Honda AHM Beat ESP', true);
                        $map('CVT-014', 'roller', 'Roller weight Astra Aspira Beat ESP 8.5g');
                        $map('CVT-016', 'per_cvt', 'Per CVT original Honda AHM Beat ESP/Scoopy', true);
                        $map('CVT-020', 'per_cvt', 'Per CVT Astra Aspira Beat ESP');
                        $map('CVT-022', 'kampas_ganda', 'Kampas ganda original Honda AHM Beat ESP/Scoopy', true);
                        $map('CVT-026', 'kampas_ganda', 'Kampas ganda Astra Aspira Beat ESP');
                    }
                } elseif ($isYamaha) {
                    if ($isNmax) {
                        $map('CVT-005', 'v_belt', 'V-Belt original Yamaha YGP (2DP) NMAX 155', true);
                        $map('CVT-013', 'roller', 'Roller weight 13g original Yamaha YGP NMAX 155', true);
                        $map('CVT-019', 'per_cvt', 'Per CVT original Yamaha YGP NMAX 155', true);
                        $map('CVT-025', 'kampas_ganda', 'Kampas ganda original Yamaha YGP NMAX 155', true);
                    } elseif ($isAerox) {
                        $map('CVT-006', 'v_belt', 'V-Belt original Yamaha YGP (B65) Aerox 155', true);
                        $map('CVT-013', 'roller', 'Roller weight 13g original Yamaha YGP Aerox 155', true);
                        $map('CVT-019', 'per_cvt', 'Per CVT original Yamaha YGP Aerox 155', true);
                        $map('CVT-025', 'kampas_ganda', 'Kampas ganda original Yamaha YGP Aerox 155', true);
                    } else {
                        // Mio M3, Gear, Fino, Fazzio, Mio J
                        $map('CVT-004', 'v_belt', 'V-Belt original Yamaha YGP (2PH) Mio M3/Gear/Fazzio', true);
                        $map('CVT-009', 'v_belt', 'V-Belt Kit + Roller Astra Aspira Mio M3 125');
                        $map('CVT-012', 'roller', 'Roller weight 12g original Yamaha YGP Mio M3/Gear', true);
                        $map('CVT-015', 'roller', 'Roller weight Astra Aspira Mio M3 12g');
                        $map('CVT-018', 'per_cvt', 'Per CVT original Yamaha YGP Mio M3/Fino', true);
                        $map('CVT-021', 'per_cvt', 'Per CVT Astra Aspira Mio M3');
                        $map('CVT-024', 'kampas_ganda', 'Kampas ganda original Yamaha YGP Mio M3/Gear', true);
                        $map('CVT-027', 'kampas_ganda', 'Kampas ganda Astra Aspira Mio M3 125');
                    }
                }
            } elseif ($isManual) {
                // --- Gear Set, Rantai, Kampas Kopling, Kabel Kopling KHUSUS BEBEK & SPORT ---
                if ($isHonda && $isBebek) {
                    if ($isSupra) {
                        $map('CVT-028', 'gear_set', 'Gear set + rantai original Honda AHM Supra X 125', true);
                        $map('CVT-033', 'gear_set', 'Gear set + rantai Astra Aspira Supra X 125');
                    } else {
                        $map('CVT-029', 'gear_set', 'Gear set + rantai original Honda AHM Revo Fit', true);
                        $map('CVT-034', 'gear_set', 'Gear set + rantai Astra Aspira Revo Fit');
                    }
                    $map('CVT-037', 'rantai', 'Rantai roda Astra Aspira 428-104L Bebek');
                    $map('CVT-039', 'rantai', 'Rantai roda original Honda AHM 428-106L Bebek', true);
                    $map('CVT-040', 'kampas_kopling', 'Kampas kopling original Honda AHM Supra X 125/Revo', true);
                    $map('CVT-044', 'kampas_kopling', 'Kampas kopling Astra Aspira Supra X 125');
                } elseif ($isHonda && $isSport) {
                    $map('CVT-030', 'gear_set', 'Gear set + rantai original Honda AHM CB150R', true);
                    $map('CVT-036', 'gear_set', 'Gear set + rantai Astra Aspira CB150R (428-120L)');
                    $map('CVT-038', 'rantai', 'Rantai roda Astra Aspira 428-120L Sport', true);
                    $map('CVT-041', 'kampas_kopling', 'Kampas kopling original Honda AHM CB150R/CBR150R', true);
                    $map('CVT-046', 'kampas_kopling', 'Kampas kopling Astra Aspira CB150R');
                    if (str_contains($model, 'cbr') || str_contains($model, 'sonic')) {
                        $map('CVT-048', 'kabel_kopling', 'Kabel kopling original Honda AHM CBR150R/Sonic', true);
                    } else {
                        $map('CVT-047', 'kabel_kopling', 'Kabel kopling original Honda AHM CB150R', true);
                    }
                    $map('CVT-051', 'kabel_kopling', 'Kabel kopling Astra Aspira CB150R');
                } elseif ($isYamaha && $isBebek) {
                    $map('CVT-031', 'gear_set', 'Gear set + rantai original Yamaha YGP Jupiter Z1', true);
                    $map('CVT-035', 'gear_set', 'Gear set + rantai Astra Aspira Jupiter Z1');
                    $map('CVT-037', 'rantai', 'Rantai roda Astra Aspira 428-104L Bebek', true);
                    $map('CVT-042', 'kampas_kopling', 'Kampas kopling original Yamaha YGP Jupiter Z1/Vega', true);
                    $map('CVT-045', 'kampas_kopling', 'Kampas kopling Astra Aspira Jupiter Z1');
                    if ($isMx) {
                        $map('CVT-050', 'kabel_kopling', 'Kabel kopling original Yamaha YGP MX King 150', true);
                        $map('CVT-052', 'kabel_kopling', 'Kabel kopling Astra Aspira Vixion/MX King');
                    }
                } elseif ($isYamaha && $isSport) {
                    $map('CVT-032', 'gear_set', 'Gear set + rantai original Yamaha YGP Vixion/R15', true);
                    $map('CVT-036', 'gear_set', 'Gear set + rantai Astra Aspira Vixion (428-120L)');
                    $map('CVT-038', 'rantai', 'Rantai roda Astra Aspira 428-120L Sport', true);
                    $map('CVT-043', 'kampas_kopling', 'Kampas kopling original Yamaha YGP Vixion/R15', true);
                    $map('CVT-046', 'kampas_kopling', 'Kampas kopling Astra Aspira Vixion');
                    if (str_contains($model, 'r15')) {
                        $map('CVT-050', 'kabel_kopling', 'Kabel kopling original Yamaha YGP R15', true);
                    } else {
                        $map('CVT-049', 'kabel_kopling', 'Kabel kopling original Yamaha YGP Vixion', true);
                    }
                    $map('CVT-052', 'kabel_kopling', 'Kabel kopling Astra Aspira Vixion/R15');
                }
            }

            // =================================================================
            // 5. KELISTRIKAN & PENGAPIAN
            // =================================================================
            // --- Aki / Battery ---
            if ($isVarioMid || $isVario160 || $isPcx150 || $isPcx160 || str_contains($model, 'adv') || $isNmax || $isAerox || $isScoopyR12) {
                $map('ELC-003', 'aki', 'Aki MF 12V 5Ah GS Astra GTZ6V ISS/Maxi', true);
                $map('ELC-004', 'aki', 'Aki MF 12V 5Ah Yuasa YTZ6V ISS/Maxi');
            } elseif ($isSport) {
                $map('ELC-005', 'aki', 'Aki MF 12V 6Ah GS Astra GTZ7S Sport 150cc', true);
                $map('ELC-001', 'aki', 'Aki MF 12V 3.5Ah GS Astra GTZ5S');
                $map('ELC-002', 'aki', 'Aki MF 12V 3.5Ah Yuasa YTZ5S');
            } else {
                $map('ELC-001', 'aki', 'Aki MF 12V 3.5Ah GS Astra GTZ5S', true);
                $map('ELC-002', 'aki', 'Aki MF 12V 3.5Ah Yuasa YTZ5S');
            }

            // --- Busi ---
            if ($isHonda && $isMatic) {
                if ($isVarioMid || $isVario160 || $isPcx150 || $isPcx160) {
                    $map('ELC-007', 'busi', 'Busi original Honda AHM (CPR6EA-9) Vario 125/150/PCX', true);
                } else {
                    $map('ELC-006', 'busi', 'Busi original Honda AHM (CPR9EA-9) Beat/Scoopy/Genio', true);
                    $map('ELC-013', 'busi', 'Busi Astra Aspira CPR9EA-9');
                }
            } elseif ($isHonda && $isBebek) {
                $map('ELC-008', 'busi', 'Busi original Honda AHM (CPR7EA-9) Supra X 125/Revo', true);
                $map('ELC-014', 'busi', 'Busi Astra Aspira CPR7EA-9 Bebek');
            } elseif ($isHonda && $isSport) {
                $map('ELC-009', 'busi', 'Busi original Honda AHM (CPR8EA-9) CB150R/CBR150R', true);
            } elseif ($isYamaha && $isMatic) {
                if ($isNmax || $isAerox) {
                    $map('ELC-012', 'busi', 'Busi original Yamaha YGP (CPR8EA-9) NMAX/Aerox', true);
                } else {
                    $map('ELC-011', 'busi', 'Busi original Yamaha YGP (CR6HSA) Mio M3/Gear/Fazzio', true);
                    $map('ELC-015', 'busi', 'Busi Astra Aspira CR6HSA Yamaha Matic');
                }
            } elseif ($isYamaha && $isBebek) {
                $map('ELC-010', 'busi', 'Busi original Yamaha YGP (CR6HSA) Jupiter Z1/Vega', true);
                $map('ELC-014', 'busi', 'Busi Astra Aspira C7HSA Bebek');
            } elseif ($isYamaha && $isSport) {
                $map('ELC-012', 'busi', 'Busi original Yamaha YGP (CPR8EA-9) Vixion/R15', true);
            }

            // --- Kiprok / Regulator ---
            if ($isHonda && $isMatic) {
                $map('ELC-016', 'kiprok', 'Kiprok regulator original Honda AHM Beat ESP/Scoopy', true);
                $map('ELC-020', 'kiprok', 'Kiprok regulator Astra Aspira Beat/Vario');
            } elseif ($isHonda && $isBebek) {
                $map('ELC-017', 'kiprok', 'Kiprok regulator original Honda AHM Supra X 125/Revo', true);
                $map('ELC-021', 'kiprok', 'Kiprok regulator Astra Aspira Supra X 125/Revo');
            } elseif ($isHonda && $isSport) {
                $map('ELC-016', 'kiprok', 'Kiprok regulator original Honda AHM', true);
                $map('ELC-020', 'kiprok', 'Kiprok regulator Astra Aspira');
            } elseif ($isYamaha && $isMatic) {
                $map('ELC-018', 'kiprok', 'Kiprok regulator original Yamaha YGP Mio M3/Fino', true);
                $map('ELC-022', 'kiprok', 'Kiprok regulator Astra Aspira Mio');
            } elseif ($isYamaha && $isBebek) {
                $map('ELC-019', 'kiprok', 'Kiprok regulator original Yamaha YGP Jupiter Z1/Vega', true);
                $map('ELC-022', 'kiprok', 'Kiprok regulator Astra Aspira Jupiter Z');
            } elseif ($isYamaha && $isSport) {
                $map('ELC-018', 'kiprok', 'Kiprok regulator original Yamaha YGP', true);
                $map('ELC-022', 'kiprok', 'Kiprok regulator Astra Aspira');
            }

            // --- CDI / ECU ---
            if ($isHonda && $isMatic) {
                if (str_contains($model, 'karbu')) {
                    $map('ELC-027', 'cdi_ecu', 'CDI unit pengapian Astra Aspira Karbu', true);
                } else {
                    $map('ELC-023', 'cdi_ecu', 'Komputer ECU / ECM original Honda AHM Beat ESP', true);
                }
            } elseif ($isHonda && $isBebek) {
                if (str_contains($model, 'karbu') || str_contains($model, 'lama')) {
                    $map('ELC-027', 'cdi_ecu', 'CDI unit pengapian Astra Aspira Supra Lama/Grand', true);
                } else {
                    $map('ELC-024', 'cdi_ecu', 'Komputer ECU / ECM original Honda AHM Supra X 125 FI', true);
                }
            } elseif ($isYamaha && $isMatic) {
                if (str_contains($model, 'karbu') || str_contains($model, 'sporty') || str_contains($model, 'smile')) {
                    $map('ELC-028', 'cdi_ecu', 'CDI unit pengapian Astra Aspira Mio Karbu', true);
                } else {
                    $map('ELC-025', 'cdi_ecu', 'Komputer ECU / ECM original Yamaha YGP Mio M3 125', true);
                }
            } elseif ($isYamaha && $isBebek) {
                $map('ELC-026', 'cdi_ecu', 'Komputer ECU / ECM original Yamaha YGP Jupiter Z1', true);
            }

            // --- Koil Pengapian ---
            if ($isHonda && $isMatic) {
                $map('ELC-029', 'koil', 'Koil pengapian original Honda AHM Beat ESP/Scoopy', true);
                $map('ELC-033', 'koil', 'Koil pengapian Astra Aspira Honda Matic');
            } elseif ($isHonda && $isBebek) {
                $map('ELC-030', 'koil', 'Koil pengapian original Honda AHM Supra X 125/Revo', true);
                $map('ELC-033', 'koil', 'Koil pengapian Astra Aspira Honda Bebek');
            } elseif ($isHonda && $isSport) {
                $map('ELC-029', 'koil', 'Koil pengapian original Honda AHM', true);
                $map('ELC-033', 'koil', 'Koil pengapian Astra Aspira');
            } elseif ($isYamaha && $isMatic) {
                $map('ELC-031', 'koil', 'Koil pengapian original Yamaha YGP Mio M3/Fino', true);
                $map('ELC-034', 'koil', 'Koil pengapian Astra Aspira Yamaha Matic');
            } elseif ($isYamaha && $isBebek) {
                $map('ELC-032', 'koil', 'Koil pengapian original Yamaha YGP Jupiter Z1/Vega', true);
                $map('ELC-034', 'koil', 'Koil pengapian Astra Aspira Yamaha Bebek');
            } elseif ($isYamaha && $isSport) {
                $map('ELC-031', 'koil', 'Koil pengapian original Yamaha YGP', true);
                $map('ELC-034', 'koil', 'Koil pengapian Astra Aspira');
            }

            // --- Dinamo Starter ---
            if ($isHonda && $isMatic) {
                $map('ELC-035', 'dinamo_starter', 'Dinamo starter assy original Honda AHM Beat ESP/Scoopy', true);
                $map('ELC-039', 'dinamo_starter', 'Dinamo starter assy Astra Aspira Beat ESP');
            } elseif ($isHonda && $isBebek) {
                $map('ELC-036', 'dinamo_starter', 'Dinamo starter assy original Honda AHM Supra X 125/Revo', true);
                $map('ELC-040', 'dinamo_starter', 'Dinamo starter assy Astra Aspira Supra X 125');
            } elseif ($isHonda && $isSport) {
                $map('ELC-035', 'dinamo_starter', 'Dinamo starter original Honda AHM', true);
            } elseif ($isYamaha && $isMatic) {
                $map('ELC-037', 'dinamo_starter', 'Dinamo starter assy original Yamaha YGP Mio M3 125', true);
                $map('ELC-041', 'dinamo_starter', 'Dinamo starter assy Astra Aspira Mio M3');
            } elseif ($isYamaha && $isBebek) {
                $map('ELC-038', 'dinamo_starter', 'Dinamo starter assy original Yamaha YGP Jupiter Z1/Vega', true);
                $map('ELC-041', 'dinamo_starter', 'Dinamo starter assy Astra Aspira Jupiter Z');
            } elseif ($isYamaha && $isSport) {
                $map('ELC-037', 'dinamo_starter', 'Dinamo starter original Yamaha YGP', true);
            }

            // --- Bendik / Relay Starter ---
            if ($isHonda && $isMatic) {
                $map('ELC-042', 'bendik_starter', 'Bendik relay starter original Honda AHM Beat/Vario/Scoopy', true);
                $map('ELC-046', 'bendik_starter', 'Bendik relay starter Astra Aspira');
            } elseif ($isHonda && $isBebek) {
                $map('ELC-043', 'bendik_starter', 'Bendik relay starter original Honda AHM Supra X 125/Revo', true);
                $map('ELC-046', 'bendik_starter', 'Bendik relay starter Astra Aspira');
            } elseif ($isHonda && $isSport) {
                $map('ELC-042', 'bendik_starter', 'Bendik relay starter original Honda AHM', true);
                $map('ELC-046', 'bendik_starter', 'Bendik relay starter Astra Aspira');
            } elseif ($isYamaha && $isMatic) {
                $map('ELC-044', 'bendik_starter', 'Bendik relay starter original Yamaha YGP Mio M3/NMAX', true);
                $map('ELC-046', 'bendik_starter', 'Bendik relay starter Astra Aspira');
            } elseif ($isYamaha && $isBebek) {
                $map('ELC-045', 'bendik_starter', 'Bendik relay starter original Yamaha YGP Jupiter Z1/Vega', true);
                $map('ELC-046', 'bendik_starter', 'Bendik relay starter Astra Aspira');
            } elseif ($isYamaha && $isSport) {
                $map('ELC-044', 'bendik_starter', 'Bendik relay starter original Yamaha YGP', true);
                $map('ELC-046', 'bendik_starter', 'Bendik relay starter Astra Aspira');
            }

            // =================================================================
            // 6. LAMPU & SAKLAR
            // =================================================================
            if ($isHonda) {
                $map('LMP-001', 'lampu_depan', 'Bohlam depan 12V 35W original Honda AHM Stanley', true);
                $map('LMP-003', 'lampu_depan', 'Bohlam depan halogen 12V 35W Astra Aspira');
                $map('LMP-004', 'lampu_belakang', 'Bohlam rem belakang 12V original Honda AHM Stanley', true);
                $map('LMP-005', 'lampu_belakang', 'Bohlam rem belakang 12V Astra Aspira');
                $map('LMP-006', 'lampu_sein', 'Bohlam sein 12V 10W original Honda AHM Stanley', true);
                $map('LMP-007', 'lampu_sein', 'Bohlam sein 12V Astra Aspira');
                $map('LMP-008', 'saklar', 'Saklar switch starter & dimmer original Honda AHM', true);
                $map('LMP-010', 'saklar', 'Switch rem depan & belakang Astra Aspira');
                $map('LMP-011', 'klakson', 'Klakson 12V original Honda AHM', true);
                $map('LMP-013', 'klakson', 'Klakson 12V Astra Aspira');
            } elseif ($isYamaha) {
                $map('LMP-002', 'lampu_depan', 'Bohlam depan 12V 35W original Yamaha YGP Halogen', true);
                $map('LMP-003', 'lampu_depan', 'Bohlam depan halogen 12V 35W Astra Aspira');
                $map('LMP-004', 'lampu_belakang', 'Bohlam rem belakang 12V Stanley', true);
                $map('LMP-005', 'lampu_belakang', 'Bohlam rem belakang 12V Astra Aspira');
                $map('LMP-006', 'lampu_sein', 'Bohlam sein 12V 10W Stanley', true);
                $map('LMP-007', 'lampu_sein', 'Bohlam sein 12V Astra Aspira');
                $map('LMP-009', 'saklar', 'Saklar switch klakson & sein original Yamaha YGP', true);
                $map('LMP-010', 'saklar', 'Switch rem depan & belakang Astra Aspira');
                $map('LMP-012', 'klakson', 'Klakson 12V original Yamaha YGP', true);
                $map('LMP-013', 'klakson', 'Klakson 12V Astra Aspira');
            } else {
                $map('LMP-003', 'lampu_depan', 'Bohlam depan halogen 12V 35W Astra Aspira', true);
                $map('LMP-005', 'lampu_belakang', 'Bohlam rem belakang 12V Astra Aspira', true);
                $map('LMP-007', 'lampu_sein', 'Bohlam sein 12V Astra Aspira', true);
                $map('LMP-010', 'saklar', 'Switch rem depan & belakang Astra Aspira', true);
                $map('LMP-013', 'klakson', 'Klakson 12V Astra Aspira', true);
            }

            // =================================================================
            // 7. MESIN & FILTER
            // =================================================================
            // --- Filter Udara ---
            if ($isHonda && $isMatic) {
                if ($isVarioMid) {
                    $map('FLT-002', 'filter_udara', 'Filter udara original Honda AHM Vario 125/150', true);
                } else {
                    $map('FLT-001', 'filter_udara', 'Filter udara original Honda AHM Beat ESP/Scoopy', true);
                    $map('FLT-009', 'filter_udara', 'Filter udara Astra Aspira Beat ESP');
                }
            } elseif ($isHonda && $isBebek) {
                $map('FLT-003', 'filter_udara', 'Filter udara original Honda AHM Supra X 125 FI', true);
                $map('FLT-013', 'filter_udara', 'Filter udara Astra Aspira Supra X 125');
            } elseif ($isHonda && $isSport) {
                $map('FLT-004', 'filter_udara', 'Filter udara original Honda AHM CB150R', true);
            } elseif ($isYamaha && $isMatic) {
                if ($isNmax) {
                    $map('FLT-006', 'filter_udara', 'Filter udara original Yamaha YGP NMAX 155', true);
                } else {
                    $map('FLT-005', 'filter_udara', 'Filter udara original Yamaha YGP Mio M3 125', true);
                    $map('FLT-014', 'filter_udara', 'Filter udara Astra Aspira Mio M3 125');
                }
            } elseif ($isYamaha && $isBebek) {
                $map('FLT-007', 'filter_udara', 'Filter udara original Yamaha YGP Jupiter Z1', true);
                $map('FLT-015', 'filter_udara', 'Filter udara Astra Aspira Jupiter Z1');
            } elseif ($isYamaha && $isSport) {
                $map('FLT-008', 'filter_udara', 'Filter udara original Yamaha YGP Vixion', true);
            }

            // --- Filter Oli Mesin (HANYA MOTOR SPORT / BEBEK TERTENTU) ---
            if ($isSport || $isMx) {
                if ($isHonda) {
                    $map('FLT-016', 'filter_oli', 'Filter oli mesin original Honda AHM CB150R/CBR150R', true);
                    $map('FLT-018', 'filter_oli', 'Filter oli mesin Astra Aspira CB150R');
                } elseif ($isYamaha) {
                    $map('FLT-017', 'filter_oli', 'Filter oli mesin original Yamaha YGP Vixion/R15/Jupiter MX', true);
                    $map('FLT-018', 'filter_oli', 'Filter oli mesin Astra Aspira Vixion');
                }
            }

            // --- Karburator (HANYA MOTOR KARBURATOR) ---
            if (str_contains($model, 'karbu') || str_contains($model, 'fit') || str_contains($model, 'grand') || str_contains($model, 'sporty') || str_contains($model, 'smile')) {
                if ($isHonda && $isMatic) {
                    $map('MSN-002', 'karburator', 'Repair kit karburator original Honda AHM Beat Karbu', true);
                    $map('MSN-005', 'karburator', 'Repair kit karburator Astra Aspira Beat Karbu');
                } elseif ($isHonda && $isBebek) {
                    $map('MSN-001', 'karburator', 'Repair kit karburator original Honda AHM Supra Fit/Grand', true);
                    $map('MSN-005', 'karburator', 'Repair kit karburator Astra Aspira Supra Fit');
                } elseif ($isYamaha && $isMatic) {
                    $map('MSN-003', 'karburator', 'Repair kit karburator original Yamaha YGP Mio Karbu', true);
                    $map('MSN-006', 'karburator', 'Repair kit karburator Astra Aspira Mio Karbu');
                } elseif ($isYamaha && $isBebek) {
                    $map('MSN-004', 'karburator', 'Repair kit karburator original Yamaha YGP Jupiter Z Karbu', true);
                    $map('MSN-006', 'karburator', 'Repair kit karburator Astra Aspira Jupiter Z Karbu');
                }
            }

            // --- Injektor (HANYA MOTOR INJEKSI) ---
            if (!str_contains($model, 'karbu') && !str_contains($model, 'fit') && !str_contains($model, 'grand') && !str_contains($model, 'sporty') && !str_contains($model, 'smile')) {
                if ($isHonda && $isMatic) {
                    $map('MSN-007', 'injektor', 'Fuel injector bensin original Honda AHM Beat ESP/Scoopy', true);
                    $map('MSN-011', 'injektor', 'Injector cleaner Astra Aspira 60ml');
                } elseif ($isHonda && $isBebek) {
                    $map('MSN-008', 'injektor', 'Fuel injector bensin original Honda AHM Supra X 125 FI', true);
                    $map('MSN-011', 'injektor', 'Injector cleaner Astra Aspira 60ml');
                } elseif ($isYamaha && $isMatic) {
                    $map('MSN-009', 'injektor', 'Fuel injector bensin original Yamaha YGP Mio M3 125', true);
                    $map('MSN-011', 'injektor', 'Injector cleaner Astra Aspira 60ml');
                } elseif ($isYamaha && $isBebek) {
                    $map('MSN-010', 'injektor', 'Fuel injector bensin original Yamaha YGP Jupiter Z1', true);
                    $map('MSN-011', 'injektor', 'Injector cleaner Astra Aspira 60ml');
                }
            }

            // --- Piston & Ring ---
            if ($isHonda && $isMatic) {
                $map('MSN-012', 'piston_kit', 'Piston kit + ring piston Std original Honda AHM Beat ESP', true);
                $map('MSN-016', 'piston_kit', 'Piston kit Std Astra Aspira Beat ESP');
            } elseif ($isHonda && $isBebek) {
                $map('MSN-013', 'piston_kit', 'Piston kit + ring piston Std original Honda AHM Supra X 125', true);
                $map('MSN-017', 'piston_kit', 'Piston kit Std Astra Aspira Supra X 125');
            } elseif ($isYamaha && $isMatic) {
                $map('MSN-014', 'piston_kit', 'Piston kit + ring piston Std original Yamaha YGP Mio M3 125', true);
                $map('MSN-018', 'piston_kit', 'Piston kit Std Astra Aspira Mio M3');
            } elseif ($isYamaha && $isBebek) {
                $map('MSN-015', 'piston_kit', 'Piston kit + ring piston Std original Yamaha YGP Jupiter Z1', true);
                $map('MSN-018', 'piston_kit', 'Piston kit Std Astra Aspira Jupiter Z1');
            }

            // --- Noken As / Camshaft ---
            if ($isHonda && $isMatic) {
                $map('MSN-019', 'noken_as', 'Noken as camshaft original Honda AHM Beat ESP', true);
                $map('MSN-023', 'noken_as', 'Noken as camshaft Astra Aspira Beat ESP');
            } elseif ($isHonda && $isBebek) {
                $map('MSN-020', 'noken_as', 'Noken as camshaft original Honda AHM Supra X 125', true);
                $map('MSN-024', 'noken_as', 'Noken as camshaft Astra Aspira Supra X 125');
            } elseif ($isYamaha && $isMatic) {
                $map('MSN-021', 'noken_as', 'Noken as camshaft original Yamaha YGP Mio M3 125', true);
                $map('MSN-025', 'noken_as', 'Noken as camshaft Astra Aspira Mio M3');
            } elseif ($isYamaha && $isBebek) {
                $map('MSN-022', 'noken_as', 'Noken as camshaft original Yamaha YGP Jupiter Z1', true);
                $map('MSN-025', 'noken_as', 'Noken as camshaft Astra Aspira Jupiter Z');
            }

            // --- Klep / Valve ---
            if ($isHonda && $isMatic) {
                $map('MSN-026', 'klep', 'Katup klep In & Ex original Honda AHM Beat ESP (Sepasang)', true);
                $map('MSN-030', 'klep', 'Katup klep In & Ex Astra Aspira Beat ESP (Sepasang)');
            } elseif ($isHonda && $isBebek) {
                $map('MSN-027', 'klep', 'Katup klep In & Ex original Honda AHM Supra X 125 (Sepasang)', true);
                $map('MSN-031', 'klep', 'Katup klep In & Ex Astra Aspira Supra X 125 (Sepasang)');
            } elseif ($isYamaha && $isMatic) {
                $map('MSN-028', 'klep', 'Katup klep In & Ex original Yamaha YGP Mio M3 125 (Sepasang)', true);
                $map('MSN-032', 'klep', 'Katup klep In & Ex Astra Aspira Mio M3 (Sepasang)');
            } elseif ($isYamaha && $isBebek) {
                $map('MSN-029', 'klep', 'Katup klep In & Ex original Yamaha YGP Jupiter Z1 (Sepasang)', true);
                $map('MSN-032', 'klep', 'Katup klep In & Ex Astra Aspira Jupiter Z1 (Sepasang)');
            }

            // --- Rantai Keteng / Cam Chain ---
            if ($isHonda && $isMatic) {
                $map('MSN-033', 'rantai_keteng', 'Rantai keteng kamrat original Honda AHM Beat ESP', true);
                $map('MSN-037', 'rantai_keteng', 'Rantai keteng kamrat Astra Aspira Beat ESP');
            } elseif ($isHonda && $isBebek) {
                $map('MSN-034', 'rantai_keteng', 'Rantai keteng kamrat original Honda AHM Supra X 125', true);
                $map('MSN-038', 'rantai_keteng', 'Rantai keteng kamrat Astra Aspira Supra X 125');
            } elseif ($isYamaha && $isMatic) {
                $map('MSN-035', 'rantai_keteng', 'Rantai keteng kamrat original Yamaha YGP Mio M3 125', true);
                $map('MSN-039', 'rantai_keteng', 'Rantai keteng kamrat Astra Aspira Mio M3');
            } elseif ($isYamaha && $isBebek) {
                $map('MSN-036', 'rantai_keteng', 'Rantai keteng kamrat original Yamaha YGP Jupiter Z1', true);
                $map('MSN-039', 'rantai_keteng', 'Rantai keteng kamrat Astra Aspira Jupiter Z1');
            }

            // --- Gasket / Packing ---
            if ($isHonda && $isMatic) {
                $map('MSN-040', 'gasket_packing', 'Paking top set blok mesin original Honda AHM Beat ESP', true);
                $map('MSN-044', 'gasket_packing', 'Paking blok CVT Astra Aspira Beat ESP');
            } elseif ($isHonda && $isBebek) {
                $map('MSN-041', 'gasket_packing', 'Paking top set blok mesin original Honda AHM Supra X 125', true);
                $map('MSN-045', 'gasket_packing', 'Paking top set blok mesin Astra Aspira Supra X 125');
            } elseif ($isYamaha && $isMatic) {
                $map('MSN-042', 'gasket_packing', 'Paking top set blok mesin original Yamaha YGP Mio M3 125', true);
                $map('MSN-046', 'gasket_packing', 'Paking top set blok mesin Astra Aspira Mio M3');
            } elseif ($isYamaha && $isBebek) {
                $map('MSN-043', 'gasket_packing', 'Paking top set blok mesin original Yamaha YGP Jupiter Z1', true);
                $map('MSN-046', 'gasket_packing', 'Paking top set blok mesin Astra Aspira Jupiter Z');
            }

            // =================================================================
            // 8. BODI & AKSESORIS
            // =================================================================
            // --- Spion & Handgrip ---
            if ($isHonda) {
                $map('AKS-001', 'spion', 'Kaca spion standar original Honda AHM (Sepasang)', true);
                $map('AKS-003', 'spion', 'Kaca spion standar Astra Aspira model Honda (Sepasang)');
                $map('AKS-005', 'handgrip', 'Handgrip karet stang original Honda AHM (Sepasang)', true);
                $map('AKS-007', 'handgrip', 'Handgrip karet lembut Astra Aspira (Sepasang)');
            } elseif ($isYamaha) {
                $map('AKS-002', 'spion', 'Kaca spion standar original Yamaha YGP (Sepasang)', true);
                $map('AKS-004', 'spion', 'Kaca spion standar Astra Aspira model Yamaha (Sepasang)');
                $map('AKS-006', 'handgrip', 'Handgrip karet stang original Yamaha YGP (Sepasang)', true);
                $map('AKS-007', 'handgrip', 'Handgrip karet lembut Astra Aspira (Sepasang)');
            } else {
                $map('AKS-003', 'spion', 'Kaca spion standar Astra Aspira (Sepasang)', true);
                $map('AKS-007', 'handgrip', 'Handgrip karet lembut Astra Aspira (Sepasang)', true);
            }

            // --- Handle Rem ---
            if ($isHonda && $isMatic) {
                $map('AKS-008', 'handle_rem', 'Handle tuas rem kanan original Honda AHM Beat/Scoopy/Vario', true);
                $map('AKS-009', 'handle_rem', 'Handle tuas rem kiri CBS original Honda AHM Beat/Scoopy/Vario');
                $map('AKS-014', 'handle_rem', 'Handle tuas rem Astra Aspira Beat/Vario');
            } elseif ($isHonda && $isBebek) {
                $map('AKS-010', 'handle_rem', 'Handle tuas rem kanan cakram original Honda AHM Supra X 125/Revo', true);
                $map('AKS-015', 'handle_rem', 'Handle tuas rem kanan Astra Aspira Supra X 125/Revo');
            } elseif ($isHonda && $isSport) {
                $map('AKS-010', 'handle_rem', 'Handle tuas rem kanan original Honda AHM', true);
                $map('AKS-015', 'handle_rem', 'Handle tuas rem Astra Aspira');
            } elseif ($isYamaha && $isMatic) {
                $map('AKS-011', 'handle_rem', 'Handle tuas rem kanan original Yamaha YGP Mio M3/Fino', true);
                $map('AKS-012', 'handle_rem', 'Handle tuas rem kiri original Yamaha YGP Mio M3/Fino');
                $map('AKS-016', 'handle_rem', 'Handle tuas rem Astra Aspira Mio');
            } elseif ($isYamaha && $isBebek) {
                $map('AKS-013', 'handle_rem', 'Handle tuas rem kanan original Yamaha YGP Jupiter Z1/Vega', true);
                $map('AKS-016', 'handle_rem', 'Handle tuas rem Astra Aspira Jupiter Z');
            } elseif ($isYamaha && $isSport) {
                $map('AKS-013', 'handle_rem', 'Handle tuas rem kanan original Yamaha YGP', true);
                $map('AKS-016', 'handle_rem', 'Handle tuas rem Astra Aspira');
            }

            // --- Handle Kopling (HANYA MOTOR SPORT / KOPLING MANUAL) ---
            if ($isSport || $isMx) {
                if ($isHonda) {
                    $map('AKS-017', 'handle_kopling', 'Handle tuas kopling kiri original Honda AHM CB150R', true);
                    $map('AKS-019', 'handle_kopling', 'Handle tuas kopling kiri Astra Aspira CB150R');
                } elseif ($isYamaha) {
                    $map('AKS-018', 'handle_kopling', 'Handle tuas kopling kiri original Yamaha YGP Vixion/R15/MX King', true);
                    $map('AKS-020', 'handle_kopling', 'Handle tuas kopling kiri Astra Aspira Vixion');
                }
            }

            // --- Kabel Gas ---
            if ($isHonda && $isMatic) {
                $map('AKS-021', 'kabel_gas', 'Kabel gas throttle cable original Honda AHM Beat ESP/Scoopy', true);
                $map('AKS-027', 'kabel_gas', 'Kabel gas throttle cable Astra Aspira Beat ESP');
            } elseif ($isHonda && $isBebek) {
                $map('AKS-022', 'kabel_gas', 'Kabel gas throttle cable original Honda AHM Supra X 125 FI', true);
                $map('AKS-028', 'kabel_gas', 'Kabel gas throttle cable Astra Aspira Supra X 125');
            } elseif ($isHonda && $isSport) {
                $map('AKS-023', 'kabel_gas', 'Kabel gas throttle cable original Honda AHM CB150R', true);
            } elseif ($isYamaha && $isMatic) {
                $map('AKS-024', 'kabel_gas', 'Kabel gas throttle cable original Yamaha YGP Mio M3 125', true);
                $map('AKS-029', 'kabel_gas', 'Kabel gas throttle cable Astra Aspira Mio M3');
            } elseif ($isYamaha && $isBebek) {
                $map('AKS-025', 'kabel_gas', 'Kabel gas throttle cable original Yamaha YGP Jupiter Z1', true);
                $map('AKS-029', 'kabel_gas', 'Kabel gas throttle cable Astra Aspira Jupiter Z1');
            } elseif ($isYamaha && $isSport) {
                $map('AKS-026', 'kabel_gas', 'Kabel gas throttle cable original Yamaha YGP Vixion', true);
            }

            // =================================================================
            // 9. LAIN-LAIN
            // =================================================================
            // --- Baut & Mur ---
            if ($isHonda) {
                $map('BAU-001', 'baut_mur', 'Baut tap pembuangan oli mesin + ring washer original Honda AHM', true);
                $map('BAU-003', 'baut_mur', 'Baut klip bodi kancingan cover Astra Aspira (10 Pcs)');
            } elseif ($isYamaha) {
                $map('BAU-002', 'baut_mur', 'Baut tap pembuangan oli mesin + ring washer original Yamaha YGP', true);
                $map('BAU-003', 'baut_mur', 'Baut klip bodi kancingan cover Astra Aspira (10 Pcs)');
            } else {
                $map('BAU-003', 'baut_mur', 'Baut klip bodi kancingan cover Astra Aspira (10 Pcs)', true);
            }

            // --- Kunci Kontak, Standar Samping & Gantungan Barang ---
            if ($isHonda && $isMatic) {
                $map('AKS-030', 'lainnya', 'Kunci kontak set utama + kunci jok original Honda AHM Beat ESP', true);
                $map('AKS-034', 'lainnya', 'Standar samping side stand original Honda AHM Beat/Scoopy');
                $map('AKS-038', 'lainnya', 'Gantungan barang serbaguna dek Astra Aspira');
            } elseif ($isHonda && $isBebek) {
                $map('AKS-031', 'lainnya', 'Kunci kontak set utama + kunci jok original Honda AHM Supra X 125', true);
                $map('AKS-035', 'lainnya', 'Standar samping side stand original Honda AHM Supra X 125/Revo');
                $map('AKS-038', 'lainnya', 'Gantungan barang serbaguna dek Astra Aspira');
            } elseif ($isYamaha && $isMatic) {
                $map('AKS-032', 'lainnya', 'Kunci kontak set utama + kunci jok original Yamaha YGP Mio M3 125', true);
                $map('AKS-036', 'lainnya', 'Standar samping side stand original Yamaha YGP Mio/Fino');
                $map('AKS-038', 'lainnya', 'Gantungan barang serbaguna dek Astra Aspira');
            } elseif ($isYamaha && $isBebek) {
                $map('AKS-033', 'lainnya', 'Kunci kontak set utama + kunci jok original Yamaha YGP Jupiter Z1', true);
                $map('AKS-037', 'lainnya', 'Standar samping side stand original Yamaha YGP Jupiter Z1/Vega');
                $map('AKS-038', 'lainnya', 'Gantungan barang serbaguna dek Astra Aspira');
            } else {
                $map('AKS-038', 'lainnya', 'Gantungan barang serbaguna Astra Aspira', true);
            }
        }
    }
}
