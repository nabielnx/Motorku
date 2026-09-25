<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $products = [
            // =========================================================================
            // ================= 1. PELUMAS & CAIRAN ===================================
            // =========================================================================
            // --- OLI MESIN ---
            ['OLI-001', 'AHM Oil MPX2 10W-30 0.8L (Matic Honda)', 52000, 'Oli & Pelumas', 'Oli mesin matic original Honda AHM Oil MPX2 0.8 liter untuk Beat, Scoopy, Vario 110/125/150, Genio, Spacy'],
            ['OLI-002', 'AHM Oil SPX2 10W-30 0.8L (Full Synthetic Matic Honda)', 67000, 'Oli & Pelumas', 'Oli mesin matic original Honda AHM Oil SPX2 Full Synthetic 0.8 liter performa maksimal Vario, PCX, ADV, Beat'],
            ['OLI-003', 'AHM Oil MPX1 10W-30 0.8L (Bebek Honda)', 50000, 'Oli & Pelumas', 'Oli mesin bebek original Honda AHM Oil MPX1 0.8 liter untuk Supra X 125, Revo Fit, Blade 125'],
            ['OLI-004', 'AHM Oil MPX1 10W-30 1L (Sport Honda)', 62000, 'Oli & Pelumas', 'Oli mesin sport original Honda AHM Oil MPX1 1.0 liter untuk CB150R, CBR150R, Verza, Megapro, CRF150L, Supra GTR'],
            ['OLI-005', 'AHM Oil SPX1 10W-30 1L (Full Synthetic Sport Honda)', 78000, 'Oli & Pelumas', 'Oli mesin sport original Honda AHM Oil SPX1 Full Synthetic 1.0 liter untuk CBR150R, CB150R, Sonic 150R'],
            ['OLI-006', 'Yamalube Power Matic 10W-40 0.8L (Matic Yamaha)', 52000, 'Oli & Pelumas', 'Oli mesin matic original Yamaha Yamalube Power Matic semi synthetic 0.8L untuk Mio M3, Mio J, Gear 125, Freego, Fazzio, Fino'],
            ['OLI-007', 'Yamalube Super Matic 10W-40 1L (NMAX / Aerox)', 68000, 'Oli & Pelumas', 'Oli mesin matic original Yamaha Yamalube Super Matic Full Synthetic 1.0 liter untuk NMAX 155, Aerox 155, Lexi LX 155'],
            ['OLI-008', 'Yamalube Silver Motor 20W-50 0.8L (Bebek Yamaha)', 44000, 'Oli & Pelumas', 'Oli mesin bebek original Yamaha Yamalube Silver 0.8 liter untuk Vega R, Vega ZR, Vega Force, Jupiter Z, Jupiter Z1'],
            ['OLI-009', 'Yamalube Sport 10W-40 1L (Sport Yamaha)', 62000, 'Oli & Pelumas', 'Oli mesin sport original Yamaha Yamalube Sport 1.0 liter untuk Vixion, R15, MT-15, XSR 155, MX King 150'],
            ['OLI-010', 'Astra Aspira Oil Matic SAE 10W-30 0.8L', 42000, 'Oli & Pelumas', 'Oli mesin matic berkualitas Astra Otoparts Aspira Oil SAE 10W-30 API SL JASO MB 0.8 liter untuk matic Honda & Yamaha'],
            ['OLI-011', 'Astra Aspira Oil 4T SAE 20W-50 0.8L (Bebek & Sport)', 39000, 'Oli & Pelumas', 'Oli mesin 4T manual berkualitas Astra Otoparts Aspira Oil SAE 20W-50 API SJ JASO MA 0.8 liter untuk bebek dan sport'],

            // --- OLI GARDAN / GEAR OIL ---
            ['OLI-012', 'Oli Gardan AHM Honda 120ml', 18000, 'Oli & Pelumas', 'Oli transmisi/gardan original Honda AHM untuk seluruh motor matic Honda Beat, Vario, Scoopy, PCX (120ml)'],
            ['OLI-013', 'Oli Gardan Yamalube 100ml (Matic Yamaha)', 15000, 'Oli & Pelumas', 'Oli transmisi/gardan original Yamaha Yamalube untuk Mio, Fino, Gear 125, Freego, Fazzio (100ml)'],
            ['OLI-014', 'Oli Gardan Yamalube 150ml (NMAX / Aerox)', 22000, 'Oli & Pelumas', 'Oli transmisi/gardan original Yamaha Yamalube untuk NMAX 155, Aerox 155, Lexi (150ml)'],
            ['OLI-015', 'Oli Gardan Astra Aspira 120ml', 14000, 'Oli & Pelumas', 'Oli transmisi/gardan matic Astra Otoparts Aspira formula anti aus untuk motor matic (120ml)'],

            // --- MINYAK REM ---
            ['OLI-016', 'Minyak Rem AHM Honda DOT 4 150ml', 28000, 'Oli & Pelumas', 'Brake fluid original Honda AHM DOT 4 tahan suhu tinggi isi 150ml untuk rem cakram Honda'],
            ['OLI-017', 'Minyak Rem Yamalube DOT 4 50ml', 16000, 'Oli & Pelumas', 'Brake fluid original Yamaha Yamalube DOT 4 isi 50ml untuk rem cakram Yamaha'],
            ['OLI-018', 'Minyak Rem Astra Aspira DOT 3 50ml', 12000, 'Oli & Pelumas', 'Brake fluid Astra Otoparts Aspira DOT 3 cairan rem aman untuk seal karet seluruh motor'],

            // --- AIR RADIATOR / COOLANT ---
            ['FLT-010', 'Coolant Radiator AHM Honda 500ml', 42000, 'Filter & Konsumsi', 'Air radiator coolant original Honda AHM 500ml untuk Vario 125/150/160, PCX 150/160, ADV 150/160, CBR150R, CB150R, Sonic'],
            ['FLT-011', 'Coolant Radiator Yamalube Yamacoolant 900ml', 48000, 'Filter & Konsumsi', 'Air radiator coolant original Yamaha Yamalube Yamacoolant 900ml untuk NMAX 155, Aerox 155, Lexi, Vixion, R15, MX King'],
            ['FLT-012', 'Coolant Radiator Astra Aspira 1 Liter', 35000, 'Filter & Konsumsi', 'Air radiator coolant Astra Otoparts Aspira formula anti karat & anti overheat isi 1 Liter untuk semua motor radiator'],

            // =========================================================================
            // ================= 2. KAKI-KAKI & RODA (BAN: HANYA IRC & FEDERAL AHM) ====
            // =========================================================================
            // --- BAN LUAR DEPAN ---
            ['BAN-D14-001', 'Ban Depan Federal AHM FT235 80/90-14 Tubeless', 175000, 'Ban & Velg', 'Ban luar depan tubeless Federal AHM K25/FT235 ukuran 80/90-14 OEM Honda Beat, Vario 110, Scoopy R14, Genio'],
            ['BAN-D14-002', 'Ban Depan IRC Enviro NR91 80/90-14 Tubeless', 178000, 'Ban & Velg', 'Ban luar depan tubeless IRC Enviro NR91 ukuran 80/90-14 compound eco hemat bbm untuk matic Beat, Mio M3, Fino, Gear'],
            ['BAN-D14-003', 'Ban Depan Federal AHM FT235 80/90-14 Tubetype (Non-Tubeless)', 148000, 'Ban & Velg', 'Ban luar depan non-tubeless Federal AHM 80/90-14 untuk Beat/Mio/Vario velg jari-jari'],
            ['BAN-D14-004', 'Ban Depan IRC NR73 70/90-14 Tubetype (Non-Tubeless)', 138000, 'Ban & Velg', 'Ban luar depan non-tubeless IRC NR73 70/90-14 standar pabrikan Mio Karbu, Beat Karbu, Nex'],
            ['BAN-D14-007', 'Ban Depan Federal AHM FT235 90/80-14 Tubeless', 205000, 'Ban & Velg', 'Ban luar depan tubeless Federal AHM 90/80-14 OEM standar Vario 125, Vario 150'],
            ['BAN-D14-008', 'Ban Depan IRC Exato NR88 90/80-14 Tubeless', 215000, 'Ban & Velg', 'Ban luar depan tubeless IRC Exato 90/80-14 profil sporty grip maksimal Vario 125/150'],
            ['BAN-D14-009', 'Ban Depan Federal AHM FT297 110/80-14 Tubeless (ADV / Aerox)', 285000, 'Ban & Velg', 'Ban luar depan tubeless Federal AHM FT297 dual purpose 110/80-14 OEM Honda ADV 150, ADV 160, Yamaha Aerox 155'],
            ['BAN-D14-010', 'Ban Depan IRC SCT-006 110/70-14 Tubeless (PCX 160)', 275000, 'Ban & Velg', 'Ban luar depan tubeless IRC SCT-006 110/70-14 OEM Honda PCX 160'],
            ['BAN-D14-011', 'Ban Depan Federal AHM FT235 100/80-14 Tubeless (Vario 160 / PCX 150)', 235000, 'Ban & Velg', 'Ban luar depan tubeless Federal AHM FT235 100/80-14 OEM Honda Vario 160 & PCX 150'],
            ['BAN-D13-001', 'Ban Depan IRC SS-560F 110/70-13 Tubeless (NMAX 155)', 295000, 'Ban & Velg', 'Ban luar depan tubeless IRC SS-560F 110/70-13 OEM standar Yamaha NMAX 155'],
            ['BAN-D12-001', 'Ban Depan Federal AHM FT235 100/90-12 Tubeless (Scoopy R12)', 235000, 'Ban & Velg', 'Ban luar depan tubeless Federal AHM 100/90-12 OEM Honda Scoopy Ring 12 & Genio New'],
            ['BAN-D12-002', 'Ban Depan IRC NR90 100/90-12 Tubeless (Scoopy / Fazzio)', 240000, 'Ban & Velg', 'Ban luar depan tubeless IRC NR90 100/90-12 untuk Honda Scoopy R12, Yamaha Fazzio, Filano, FreeGo'],
            ['BAN-D17-001', 'Ban Depan Federal AHM FT235 70/90-17 Tubetype (Bebek)', 148000, 'Ban & Velg', 'Ban luar depan non-tubeless Federal AHM 70/90-17 OEM Honda Supra X 125, Revo Fit, Blade 125'],
            ['BAN-D17-002', 'Ban Depan IRC NR73 70/90-17 Tubetype (Bebek)', 152000, 'Ban & Velg', 'Ban luar depan non-tubeless IRC NR73 70/90-17 standar Yamaha Jupiter Z1, Vega Force, Suzuki Smash'],
            ['BAN-D17-005', 'Ban Depan Federal AHM FT297 90/80-17 Tubeless (Sport Honda)', 225000, 'Ban & Velg', 'Ban luar depan tubeless Federal AHM 90/80-17 untuk CB150R, CBR150R, Sonic 150R, Supra GTR'],
            ['BAN-D17-006', 'Ban Depan IRC RX-01F 90/80-17 Tubeless (Sport Yamaha)', 235000, 'Ban & Velg', 'Ban luar depan tubeless IRC Road Winner RX-01F 90/80-17 untuk Vixion, R15, MX King 150'],

            // --- BAN LUAR BELAKANG ---
            ['BAN-B14-001', 'Ban Belakang Federal AHM FT235 90/90-14 Tubeless', 198000, 'Ban & Velg', 'Ban luar belakang tubeless Federal AHM K25/FT235 90/90-14 OEM Honda Beat, Vario 110, Genio'],
            ['BAN-B14-002', 'Ban Belakang IRC Enviro NR91 90/90-14 Tubeless', 205000, 'Ban & Velg', 'Ban luar belakang tubeless IRC Enviro NR91 90/90-14 compound awet hemat bbm Beat, Mio M3, Fino, Gear'],
            ['BAN-B14-003', 'Ban Belakang Federal AHM FT235 90/90-14 Tubetype (Non-Tubeless)', 168000, 'Ban & Velg', 'Ban luar belakang non-tubeless Federal AHM 90/90-14 untuk Beat/Mio/Vario velg ruji'],
            ['BAN-B14-004', 'Ban Belakang IRC NR73 80/90-14 Tubetype (Non-Tubeless)', 158000, 'Ban & Velg', 'Ban luar belakang non-tubeless IRC NR73 80/90-14 standar Mio Karbu, Beat Karbu, Nex'],
            ['BAN-B14-007', 'Ban Belakang Federal AHM FT235 100/80-14 Tubeless', 245000, 'Ban & Velg', 'Ban luar belakang tubeless Federal AHM 100/80-14 OEM Honda Vario 125 & Vario 150'],
            ['BAN-B14-008', 'Ban Belakang IRC Exato NR88 100/80-14 Tubeless', 255000, 'Ban & Velg', 'Ban luar belakang tubeless IRC Exato 100/80-14 compound premium Vario 125/150'],
            ['BAN-B14-009', 'Ban Belakang Federal AHM FT235 120/70-14 Tubeless (Vario 160 / PCX 150)', 295000, 'Ban & Velg', 'Ban luar belakang tubeless Federal AHM FT235 120/70-14 OEM Honda Vario 160 & PCX 150'],
            ['BAN-B14-010', 'Ban Belakang IRC SCT-005R 140/70-14 Tubeless (Aerox 155)', 385000, 'Ban & Velg', 'Ban luar belakang tubeless IRC SCT-005R 140/70-14 profil lebar OEM Yamaha Aerox 155'],
            ['BAN-B13-001', 'Ban Belakang IRC SS-560R 130/70-13 Tubeless (NMAX / ADV / PCX 160)', 365000, 'Ban & Velg', 'Ban luar belakang tubeless IRC SS-560R 130/70-13 OEM standar Yamaha NMAX 155, Honda ADV 150/160, PCX 160'],
            ['BAN-B13-002', 'Ban Belakang Federal AHM FT297 130/70-13 Tubeless (ADV 150 / ADV 160)', 355000, 'Ban & Velg', 'Ban luar belakang tubeless Federal AHM FT297 dual purpose 130/70-13 OEM Honda ADV 150 & ADV 160'],
            ['BAN-B12-001', 'Ban Belakang Federal AHM FT235 110/90-12 Tubeless (Scoopy R12)', 275000, 'Ban & Velg', 'Ban luar belakang tubeless Federal AHM 110/90-12 OEM Honda Scoopy Ring 12 & Genio New'],
            ['BAN-B12-002', 'Ban Belakang IRC NR90 110/90-12 Tubeless (Scoopy / Fazzio)', 285000, 'Ban & Velg', 'Ban luar belakang tubeless IRC NR90 110/90-12 untuk Honda Scoopy R12, Yamaha Fazzio, Filano, FreeGo'],
            ['BAN-B17-001', 'Ban Belakang Federal AHM FT235 80/90-17 Tubetype (Bebek)', 175000, 'Ban & Velg', 'Ban luar belakang non-tubeless Federal AHM 80/90-17 OEM Honda Supra X 125, Revo Fit, Blade 125'],
            ['BAN-B17-002', 'Ban Belakang IRC NR73 80/90-17 Tubetype (Bebek)', 182000, 'Ban & Velg', 'Ban luar belakang non-tubeless IRC NR73 80/90-17 standar Yamaha Jupiter Z1, Vega Force, Suzuki Smash'],
            ['BAN-B17-005', 'Ban Belakang Federal AHM FT297 130/70-17 Tubeless (Sport Honda)', 345000, 'Ban & Velg', 'Ban luar belakang tubeless Federal AHM 130/70-17 untuk CB150R, CBR150R, Megapro'],
            ['BAN-B17-006', 'Ban Belakang IRC RX-01R 130/70-17 Tubeless (Sport Yamaha)', 355000, 'Ban & Velg', 'Ban luar belakang tubeless IRC Road Winner RX-01R 130/70-17 untuk Vixion, R15, MT-15, MX King'],

            // --- BAN DALAM DEPAN ---
            ['BDL-14-001', 'Ban Dalam Depan Federal AHM 2.50/2.75-14 (Matic Honda)', 24000, 'Ban & Velg', 'Ban dalam depan Federal AHM original ukuran 2.50/2.75-14 untuk Beat, Vario, Scoopy non-tubeless'],
            ['BDL-14-002', 'Ban Dalam Depan IRC 2.50/2.75-14 (Matic Yamaha)', 25000, 'Ban & Velg', 'Ban dalam depan IRC original ukuran 2.50/2.75-14 kualitas karet tebal untuk Mio, Fino, Nex'],
            ['BDL-17-001', 'Ban Dalam Depan Federal AHM 2.25/2.50-17 (Bebek Honda)', 25000, 'Ban & Velg', 'Ban dalam depan Federal AHM original ukuran 2.25/2.50-17 untuk Supra X 125, Revo Fit (70/90-17)'],
            ['BDL-17-002', 'Ban Dalam Depan IRC 2.25/2.50-17 (Bebek Yamaha)', 27000, 'Ban & Velg', 'Ban dalam depan IRC original ukuran 2.25/2.50-17 untuk Jupiter Z1, Vega Force (70/90-17)'],

            // --- BAN DALAM BELAKANG ---
            ['BDL-14-003', 'Ban Dalam Belakang Federal AHM 2.75/3.00-14 (Matic Honda)', 27000, 'Ban & Velg', 'Ban dalam belakang Federal AHM original ukuran 2.75/3.00-14 untuk Beat, Vario, Scoopy (90/90-14)'],
            ['BDL-14-004', 'Ban Dalam Belakang IRC 2.75/3.00-14 (Matic Yamaha)', 28000, 'Ban & Velg', 'Ban dalam belakang IRC original ukuran 2.75/3.00-14 kualitas karet tebal untuk Mio, Fino, Nex'],
            ['BDL-17-003', 'Ban Dalam Belakang Federal AHM 2.50/2.75-17 (Bebek Honda)', 28000, 'Ban & Velg', 'Ban dalam belakang Federal AHM original ukuran 2.50/2.75-17 untuk Supra X 125, Revo Fit (80/90-17)'],
            ['BDL-17-004', 'Ban Dalam Belakang IRC 2.50/2.75-17 (Bebek Yamaha)', 30000, 'Ban & Velg', 'Ban dalam belakang IRC original ukuran 2.50/2.75-17 untuk Jupiter Z1, Vega Force (80/90-17)'],

            // --- BEARING / LAHER RODA ---
            ['KK-BRG-001', 'Bearing Laher Roda Depan AHM Honda 6201 (Set 2 Pcs)', 45000, 'Rem & Kaki-kaki', 'Bearing roda depan original Honda AHM (91052-KVB-900) kode 6201 isi 2 pcs untuk Beat, Vario, Scoopy, Supra X 125, Revo'],
            ['KK-BRG-002', 'Bearing Laher Roda Depan YGP Yamaha 6300 (Set 2 Pcs)', 42000, 'Rem & Kaki-kaki', 'Bearing roda depan original Yamaha YGP (93306-300Y4) kode 6300 isi 2 pcs untuk Mio, Fino, Jupiter Z1, Vega, Vixion'],
            ['KK-BRG-003', 'Bearing Laher Roda Astra Aspira 6201 RS (Set 2 Pcs)', 32000, 'Rem & Kaki-kaki', 'Bearing roda depan Astra Otoparts Aspira dengan penutup karet debu presisi untuk Honda & Yamaha'],

            // --- VELG ---
            ['KK-VLG-001', 'Velg Racing Cast Wheel Depan AHM Honda Beat Hitam', 485000, 'Ban & Velg', 'Velg racing palang depan original Honda AHM warna hitam glossy Beat/Vario 110/Scoopy R14'],
            ['KK-VLG-002', 'Velg Racing Cast Wheel Belakang AHM Honda Beat Hitam', 525000, 'Ban & Velg', 'Velg racing palang belakang original Honda AHM warna hitam Beat/Vario 110/Scoopy R14'],
            ['KK-VLG-003', 'Velg Racing Cast Wheel Depan YGP Yamaha Mio M3', 465000, 'Ban & Velg', 'Velg racing palang depan original Yamaha YGP warna hitam untuk Mio M3 125 / Soul GT 125'],
            ['KK-VLG-004', 'Velg Racing Cast Wheel Depan AHM Honda Supra X 125', 495000, 'Ban & Velg', 'Velg racing palang depan original Honda AHM warna hitam untuk Supra X 125 Helm-in / Revo'],
            ['KK-VLG-005', 'Velg Jari-jari Ruji Astra Aspira Ring 14x1.40', 145000, 'Ban & Velg', 'Velg rim aluminium jari-jari Astra Otoparts Aspira Ring 14 lebar 1.40 kuat dan presisi untuk matic'],
            ['KK-VLG-006', 'Velg Jari-jari Ruji Astra Aspira Ring 17x1.40', 155000, 'Ban & Velg', 'Velg rim aluminium jari-jari Astra Otoparts Aspira Ring 17 lebar 1.40 kuat dan presisi untuk bebek'],

            // --- SHOCKBREAKER DEPAN ---
            ['KK-SHK-001', 'Pipa As Shock Depan AHM Honda Beat / Scoopy / Vario 110 (Sepasang)', 215000, 'Rem & Kaki-kaki', 'Pipa as shockbreaker depan original Honda AHM (51410-K81-N01) sepasang kanan & kiri untuk Beat, Scoopy, Vario 110'],
            ['KK-SHK-002', 'Pipa As Shock Depan AHM Honda Supra X 125 / Revo (Sepasang)', 225000, 'Rem & Kaki-kaki', 'Pipa as shockbreaker depan original Honda AHM (51410-KPH-901) sepasang kanan & kiri untuk Supra X 125, Revo Fit'],
            ['KK-SHK-003', 'Pipa As Shock Depan AHM Honda CB150R (Sepasang)', 285000, 'Rem & Kaki-kaki', 'Pipa as shockbreaker depan 31mm original Honda AHM (51410-K15-901) sepasang untuk CB150R Streetfire'],
            ['KK-SHK-004', 'Pipa As Shock Depan YGP Yamaha Mio M3 / Fino (Sepasang)', 195000, 'Rem & Kaki-kaki', 'Pipa as shockbreaker depan original Yamaha YGP (2PH-F3110-00) sepasang kanan & kiri untuk Mio M3, Mio Z, Fino 125'],
            ['KK-SHK-005', 'Pipa As Shock Depan YGP Yamaha Jupiter Z1 / Vega (Sepasang)', 205000, 'Rem & Kaki-kaki', 'Pipa as shockbreaker depan original Yamaha YGP (5TP-F3110-00) sepasang untuk Jupiter Z1, Vega Force'],
            ['KK-SHK-006', 'Pipa As Shock Depan YGP Yamaha Vixion (Sepasang)', 275000, 'Rem & Kaki-kaki', 'Pipa as shockbreaker depan 33mm original Yamaha YGP (3C1-F3110-00) sepasang untuk Yamaha Vixion'],
            ['KK-SHK-007', 'Pipa As Shock Depan Astra Aspira Beat / Vario 110', 145000, 'Rem & Kaki-kaki', 'Pipa as shockbreaker depan Astra Otoparts Aspira finishing hard chrome anti bocor Beat/Vario 110'],
            ['KK-SHK-008', 'Pipa As Shock Depan Astra Aspira Supra X 125 / Revo', 150000, 'Rem & Kaki-kaki', 'Pipa as shockbreaker depan Astra Otoparts Aspira untuk Supra X 125 & Revo'],
            ['KK-SHK-009', 'Pipa As Shock Depan Astra Aspira Mio / Jupiter Z', 140000, 'Rem & Kaki-kaki', 'Pipa as shockbreaker depan Astra Otoparts Aspira untuk Mio dan Jupiter Z'],

            // --- SHOCKBREAKER BELAKANG ---
            ['KK-SHK-010', 'Shockbreaker Belakang AHM Honda Beat / Scoopy (300mm)', 245000, 'Rem & Kaki-kaki', 'Peredam kejut / rear cushion single shock original Honda AHM (52400-K81-N02) 300mm empuk untuk Beat & Scoopy'],
            ['KK-SHK-011', 'Shockbreaker Belakang AHM Honda Vario 125 / 150 (330mm)', 265000, 'Rem & Kaki-kaki', 'Peredam kejut single shock original Honda AHM (52400-KZR-601) 330mm untuk Vario 125 & Vario 150'],
            ['KK-SHK-012', 'Shockbreaker Belakang Ganda AHM Honda Supra X 125 (340mm Sepasang)', 385000, 'Rem & Kaki-kaki', 'Peredam kejut ganda rear cushion double original Honda AHM (52400-KPH-881) 340mm sepasang Supra X 125 & Revo'],
            ['KK-SHK-013', 'Shockbreaker Belakang Monoshock AHM Honda CB150R', 495000, 'Rem & Kaki-kaki', 'Monoshock belakang pro-link original Honda AHM (52400-K15-901) untuk CB150R Streetfire & CBR150R'],
            ['KK-SHK-014', 'Shockbreaker Belakang YGP Yamaha Mio M3 / Fino (300mm)', 230000, 'Rem & Kaki-kaki', 'Peredam kejut single shock original Yamaha YGP (2PH-F2210-00) 300mm untuk Mio M3, Soul GT, Fino'],
            ['KK-SHK-015', 'Shockbreaker Belakang Ganda YGP Yamaha NMAX 155 (Sepasang)', 560000, 'Rem & Kaki-kaki', 'Peredam kejut ganda original Yamaha YGP (2DP-F2210-00) sepasang untuk Yamaha NMAX 155 Old / New'],
            ['KK-SHK-016', 'Shockbreaker Belakang Ganda YGP Yamaha Jupiter Z1 (280mm Sepasang)', 365000, 'Rem & Kaki-kaki', 'Peredam kejut ganda original Yamaha YGP (5TP-F2210-00) 280mm sepasang untuk Jupiter Z1 & Vega'],
            ['KK-SHK-017', 'Shockbreaker Belakang Monoshock YGP Yamaha Vixion', 485000, 'Rem & Kaki-kaki', 'Monoshock belakang original Yamaha YGP (3C1-F2210-00) untuk Yamaha Vixion & R15'],
            ['KK-SHK-018', 'Shockbreaker Belakang Astra Aspira Beat ESP (300mm)', 175000, 'Rem & Kaki-kaki', 'Shockbreaker belakang single Astra Otoparts Aspira kenyamanan tinggi untuk Beat & Scoopy'],
            ['KK-SHK-019', 'Shockbreaker Belakang Ganda Astra Aspira Supra X 125 (Sepasang)', 285000, 'Rem & Kaki-kaki', 'Shockbreaker belakang double Astra Otoparts Aspira 340mm sepasang untuk Supra X 125 & Revo'],
            ['KK-SHK-020', 'Shockbreaker Belakang Ganda Astra Aspira Jupiter Z (Sepasang)', 275000, 'Rem & Kaki-kaki', 'Shockbreaker belakang double Astra Otoparts Aspira 280mm sepasang untuk Jupiter Z & Vega'],

            // --- SEAL SHOCKBREAKER ---
            ['KK-SEL-001', 'Seal Shock Depan + Tutup Debu AHM Honda (Matic & Bebek)', 38000, 'Rem & Kaki-kaki', 'Seal oli shockbreaker + dust seal debu original Honda AHM (51490-KGH-901) sepasang untuk Beat, Vario, Scoopy, Supra X 125, Revo'],
            ['KK-SEL-002', 'Seal Shock Depan + Tutup Debu YGP Yamaha (Matic & Bebek)', 35000, 'Rem & Kaki-kaki', 'Seal oli shockbreaker + dust seal debu original Yamaha YGP (3AY-F3145-00) sepasang untuk Mio, Fino, Jupiter Z1, Vega'],
            ['KK-SEL-003', 'Seal Shock Depan Astra Aspira Honda & Yamaha (Set)', 22000, 'Rem & Kaki-kaki', 'Seal shockbreaker depan karet NBR Astra Otoparts Aspira tahan oli & gesekan'],

            // =========================================================================
            // ================= 3. PENGEREMAN =========================================
            // =========================================================================
            // --- KAMPAS REM DEPAN / CAKRAM ---
            ['REM-001', 'Kampas Rem Depan AHM Honda (Disc Pad Beat/Vario/Scoopy/Genio)', 65000, 'Rem & Kaki-kaki', 'Kampas rem cakram depan original Honda AHM (06455-KVB-T01) untuk Beat, Vario 110/125/150, Scoopy, Genio, Spacy'],
            ['REM-002', 'Kampas Rem Depan AHM Honda (Disc Pad Supra X 125/Blade/Revo)', 62000, 'Rem & Kaki-kaki', 'Kampas rem cakram depan original Honda AHM (06455-KPP-901 / KFL) untuk Supra X 125, Revo Fit, Blade 125, CS1'],
            ['REM-003', 'Kampas Rem Depan AHM Honda (Disc Pad CB150R/CBR150R/Megapro)', 75000, 'Rem & Kaki-kaki', 'Kampas rem cakram depan original Honda AHM (06455-KRE-K01) untuk CB150R Streetfire, CBR150R, Sonic 150R, Supra GTR'],
            ['REM-004', 'Kampas Rem Depan YGP Yamaha (Disc Pad Mio/Mio M3/Fino/Soul GT)', 62000, 'Rem & Kaki-kaki', 'Kampas rem cakram depan original Yamaha YGP (5D9-F5805-00) untuk Mio Karbu, Mio J, Mio M3, Fino, Gear 125, Freego'],
            ['REM-005', 'Kampas Rem Depan YGP Yamaha (Disc Pad Jupiter Z1/Vega Force)', 58000, 'Rem & Kaki-kaki', 'Kampas rem cakram depan original Yamaha YGP (5YP-F5805-00) untuk Jupiter Z1, Jupiter MX, Vega Force, Vega ZR'],
            ['REM-006', 'Kampas Rem Depan YGP Yamaha (Disc Pad Vixion/R15/NMAX/Aerox)', 72000, 'Rem & Kaki-kaki', 'Kampas rem cakram depan original Yamaha YGP (3C1-F5805-00 / 2DP) untuk Vixion, R15, NMAX 155, Aerox 155, MX King'],
            ['REM-007', 'Kampas Rem Depan Astra Aspira (Disc Pad Honda Matic & Bebek)', 38000, 'Rem & Kaki-kaki', 'Kampas rem cakram depan Astra Otoparts Aspira pakem & awet untuk Beat, Vario, Scoopy, Supra X 125, Revo'],
            ['REM-008', 'Kampas Rem Depan Astra Aspira (Disc Pad Yamaha Matic & Bebek)', 36000, 'Rem & Kaki-kaki', 'Kampas rem cakram depan Astra Otoparts Aspira pakem & awet untuk Mio M3, Mio J, Jupiter Z1, Vega Force'],

            // --- KAMPAS REM BELAKANG / TROMOL & CAKRAM ---
            ['REM-009', 'Kampas Rem Belakang AHM Honda (Brake Shoe Tromol Matic & Bebek)', 55000, 'Rem & Kaki-kaki', 'Kampas rem tromol belakang original Honda AHM (43125-KPH-903) untuk Beat, Vario 110/125/150 CBS, Scoopy, Genio, Supra X 125 Tromol, Revo Fit'],
            ['REM-010', 'Kampas Rem Belakang AHM Honda (Disc Pad Belakang Supra X 125 DD / CB150R)', 68000, 'Rem & Kaki-kaki', 'Kampas rem cakram belakang original Honda AHM (06435-KPP-901) untuk Supra X 125 Double Disk, CB150R, CBR150R, Sonic 150R, Supra GTR'],
            ['REM-011', 'Kampas Rem Belakang YGP Yamaha (Brake Shoe Tromol Matic & Bebek)', 52000, 'Rem & Kaki-kaki', 'Kampas rem tromol belakang original Yamaha YGP (5MX-F530K-00) untuk Mio Karbu, Mio M3, Fino, Gear, Aerox 155, Jupiter Z1, Vega Force'],
            ['REM-012', 'Kampas Rem Belakang YGP Yamaha (Disc Pad Belakang NMAX / Vixion / R15 / MX King)', 68000, 'Rem & Kaki-kaki', 'Kampas rem cakram belakang original Yamaha YGP (2DP-F5806-00 / 3C1) untuk NMAX 155, Vixion New NVL/NVA, R15, MX King 150'],
            ['REM-013', 'Kampas Rem Belakang Astra Aspira (Tromol Honda Matic & Bebek)', 34000, 'Rem & Kaki-kaki', 'Kampas rem tromol belakang Astra Otoparts Aspira tidak menimbulkan bunyi untuk Beat, Vario, Scoopy, Supra X 125, Revo'],
            ['REM-014', 'Kampas Rem Belakang Astra Aspira (Tromol Yamaha Matic & Bebek)', 32000, 'Rem & Kaki-kaki', 'Kampas rem tromol belakang Astra Otoparts Aspira tidak menimbulkan bunyi untuk Mio M3, Mio J, Aerox, Jupiter Z1, Vega'],

            // --- PIRINGAN CAKRAM ---
            ['REM-015', 'Piringan Cakram Depan AHM Honda Beat / Scoopy / Vario 110/125/150 Original', 145000, 'Rem & Kaki-kaki', 'Disk brake cakram depan original Honda AHM (45351-KVB-901) lubang 4 untuk Beat, Scoopy, Vario 110/125/150'],
            ['REM-016', 'Piringan Cakram Depan AHM Honda Supra X 125 / Revo Original', 155000, 'Rem & Kaki-kaki', 'Disk brake cakram depan original Honda AHM (45251-KPH-881) lubang 4 cembung untuk Supra X 125, Revo, Blade 125'],
            ['REM-017', 'Piringan Cakram Depan AHM Honda CB150R / CBR150R Original', 215000, 'Rem & Kaki-kaki', 'Disk brake cakram depan 276mm original Honda AHM (45251-K15-901) untuk CB150R Streetfire & CBR150R'],
            ['REM-018', 'Piringan Cakram Depan YGP Yamaha Mio M3 / Fino / Mio J Original', 135000, 'Rem & Kaki-kaki', 'Disk brake cakram depan original Yamaha YGP (5TP-F582U-00) lubang 3/4 untuk Mio Karbu, Mio J, Mio M3, Fino, Soul GT'],
            ['REM-019', 'Piringan Cakram Depan YGP Yamaha Jupiter Z1 / Vega Force Original', 145000, 'Rem & Kaki-kaki', 'Disk brake cakram depan original Yamaha YGP (5YP-F582U-00) lubang 4 untuk Jupiter Z1, Jupiter MX, Vega Force'],
            ['REM-020', 'Piringan Cakram Depan YGP Yamaha Vixion / R15 / NMAX Original', 195000, 'Rem & Kaki-kaki', 'Disk brake cakram depan original Yamaha YGP (3C1-F582U-00 / 2DP) untuk Vixion, R15, NMAX 155'],
            ['REM-021', 'Piringan Cakram Depan Astra Aspira Beat / Vario', 95000, 'Rem & Kaki-kaki', 'Disk brake cakram depan Astra Otoparts Aspira baja presisi anti peyang untuk Beat & Vario'],
            ['REM-022', 'Piringan Cakram Depan Astra Aspira Supra X 125 / Revo', 98000, 'Rem & Kaki-kaki', 'Disk brake cakram depan Astra Otoparts Aspira untuk Supra X 125 & Revo'],
            ['REM-023', 'Piringan Cakram Depan Astra Aspira Mio / Jupiter Z', 90000, 'Rem & Kaki-kaki', 'Disk brake cakram depan Astra Otoparts Aspira untuk Mio dan Jupiter Z'],

            // --- MASTER REM ---
            ['REM-024', 'Master Rem Atas Assy AHM Honda Beat / Scoopy / Vario 110/125/150 Original', 195000, 'Rem & Kaki-kaki', 'Master rem atas hidrolik original Honda AHM (45510-KVB-T01) komplit tabung minyak rem untuk Beat, Scoopy, Vario 110/125/150'],
            ['REM-025', 'Master Rem Atas Assy AHM Honda Supra X 125 / Revo Original', 195000, 'Rem & Kaki-kaki', 'Master rem atas hidrolik original Honda AHM (45510-KPH-881) komplit tabung minyak rem untuk Supra X 125, Revo Fit, Blade'],
            ['REM-026', 'Master Rem Atas Assy AHM Honda CB150R / CBR150R Original', 235000, 'Rem & Kaki-kaki', 'Master rem atas hidrolik original Honda AHM (45510-K15-901) untuk CB150R Streetfire & CBR150R'],
            ['REM-027', 'Master Rem Atas Assy YGP Yamaha Mio M3 / Fino / Mio J Original', 185000, 'Rem & Kaki-kaki', 'Master rem atas hidrolik original Yamaha YGP (2PH-F583T-00 / 5TL) komplit tabung untuk Mio M3, Mio J, Fino, Soul GT'],
            ['REM-028', 'Master Rem Atas Assy YGP Yamaha Jupiter Z1 / Vega Force Original', 185000, 'Rem & Kaki-kaki', 'Master rem atas hidrolik original Yamaha YGP (5TP-F583T-00) untuk Jupiter Z1, Vega ZR, Vega Force, Jupiter MX'],
            ['REM-029', 'Master Rem Atas Assy YGP Yamaha Vixion / R15 Original', 225000, 'Rem & Kaki-kaki', 'Master rem atas hidrolik original Yamaha YGP (3C1-F583T-00) untuk Yamaha Vixion & R15'],
            ['REM-030', 'Master Rem Kit Piston Repair Kit Astra Aspira Beat / Vario', 35000, 'Rem & Kaki-kaki', 'Master cylinder piston kit karet repair kit Astra Otoparts Aspira untuk Beat, Vario, Scoopy'],
            ['REM-031', 'Master Rem Kit Piston Repair Kit Astra Aspira Supra X 125 / Revo', 35000, 'Rem & Kaki-kaki', 'Master cylinder piston kit karet repair kit Astra Otoparts Aspira untuk Supra X 125 & Revo'],
            ['REM-032', 'Master Rem Kit Piston Repair Kit Astra Aspira Mio / Jupiter Z', 32000, 'Rem & Kaki-kaki', 'Master cylinder piston kit karet repair kit Astra Otoparts Aspira untuk Mio dan Jupiter Z'],

            // --- KABEL REM ---
            ['REM-033', 'Kabel Rem Belakang AHM Honda Beat / Scoopy Original', 42000, 'Aksesoris', 'Kabel rem belakang tromol original Honda AHM (43450-K81-N01) untuk Beat ESP, Beat Street, Scoopy ESP'],
            ['REM-034', 'Kabel Rem Belakang AHM Honda Vario 125 / 150 Original', 45000, 'Aksesoris', 'Kabel rem belakang tromol original Honda AHM (43450-K59-A11) untuk Vario 125 & Vario 150 eSP'],
            ['REM-035', 'Kabel Rem Belakang YGP Yamaha Mio M3 / Fino Original', 38000, 'Aksesoris', 'Kabel rem belakang tromol original Yamaha YGP (2PH-F6351-00) untuk Mio M3, Mio Z, Fino 125'],
            ['REM-036', 'Kabel Rem Belakang YGP Yamaha Mio Sporty / Smile Original', 38000, 'Aksesoris', 'Kabel rem belakang tromol original Yamaha YGP (5TL-F6351-00) untuk Mio Karbu / Sporty / Smile'],
            ['REM-037', 'Kabel Rem Belakang Astra Aspira Beat / Scoopy', 26000, 'Aksesoris', 'Kabel rem belakang kawat baja lapis teflon Astra Otoparts Aspira Beat & Scoopy'],
            ['REM-038', 'Kabel Rem Belakang Astra Aspira Mio / Fino', 25000, 'Aksesoris', 'Kabel rem belakang kawat baja lapis teflon Astra Otoparts Aspira Mio & Fino'],

            // =========================================================================
            // ================= 4. PENGGERAK & TRANSMISI (CVT & RANTAI) ===============
            // =========================================================================
            // --- V-BELT (CVT) (KHUSUS MATIC) ---
            ['CVT-001', 'V-Belt AHM Honda Beat ESP / Deluxe / Scoopy ESP Original', 115000, 'Penggerak & CVT', 'Drive belt / V-Belt original Honda AHM (23100-K44-V01) untuk Beat ESP, Beat Deluxe, Scoopy ESP, Genio'],
            ['CVT-002', 'V-Belt AHM Honda Vario 125 / 150 eSP Original', 135000, 'Penggerak & CVT', 'Drive belt / V-Belt original Honda AHM (23100-K35-V01) untuk Vario 125 & Vario 150 eSP'],
            ['CVT-003', 'V-Belt AHM Honda PCX 160 / Vario 160 / ADV 160 Original', 165000, 'Penggerak & CVT', 'Drive belt / V-Belt original Honda AHM (23100-K1Z-N21) untuk PCX 160, Vario 160, ADV 160'],
            ['CVT-004', 'V-Belt YGP Yamaha Mio M3 / Gear 125 / Fazzio Original', 115000, 'Penggerak & CVT', 'Drive belt / V-Belt original Yamaha YGP (2PH-E7641-00) untuk Mio M3 125, Mio Z, Soul GT 125, Fino 125, Gear 125, Freego, Fazzio'],
            ['CVT-005', 'V-Belt YGP Yamaha NMAX 155 (Old / New) Original', 145000, 'Penggerak & CVT', 'Drive belt / V-Belt original Yamaha YGP (2DP-E7641-00) untuk Yamaha NMAX 155 Old & NMAX 155 Connected'],
            ['CVT-006', 'V-Belt YGP Yamaha Aerox 155 / Lexi Original', 145000, 'Penggerak & CVT', 'Drive belt / V-Belt original Yamaha YGP (B65-E7641-00) untuk Yamaha Aerox 155 & Lexi 125'],
            ['CVT-007', 'V-Belt Kit + Roller Astra Aspira Beat ESP (K44)', 135000, 'Penggerak & CVT', 'Paket hemat V-Belt + Roller set Astra Otoparts Aspira untuk Honda Beat ESP, Beat Street, Scoopy ESP'],
            ['CVT-008', 'V-Belt Kit + Roller Astra Aspira Vario 125 eSP', 155000, 'Penggerak & CVT', 'Paket hemat V-Belt + Roller set Astra Otoparts Aspira untuk Honda Vario 125 eSP'],
            ['CVT-009', 'V-Belt Kit + Roller Astra Aspira Mio M3 125 (2PH)', 135000, 'Penggerak & CVT', 'Paket hemat V-Belt + Roller set Astra Otoparts Aspira untuk Yamaha Mio M3 125, Soul GT 125, Fino 125'],

            // --- ROLLER (CVT) (KHUSUS MATIC) ---
            ['CVT-010', 'Roller Set AHM Honda Beat ESP / Scoopy 8.5g (Set 6pcs)', 55000, 'Penggerak & CVT', 'Roller weight original Honda AHM (2212A-K44-V00) bobot 8.5 gram isi 6 pcs untuk Beat ESP, Scoopy ESP, Genio'],
            ['CVT-011', 'Roller Set AHM Honda Vario 125 eSP 11g (Set 6pcs)', 60000, 'Penggerak & CVT', 'Roller weight original Honda AHM (2212A-KWN-900) bobot 11 gram isi 6 pcs untuk Vario 125'],
            ['CVT-012', 'Roller Set YGP Yamaha Mio M3 / Gear 12g (Set 6pcs)', 52000, 'Penggerak & CVT', 'Roller weight original Yamaha YGP (2PH-E7632-00) bobot 12 gram isi 6 pcs untuk Mio M3, Gear 125, Fazzio'],
            ['CVT-013', 'Roller Set YGP Yamaha NMAX 155 13g (Set 6pcs)', 65000, 'Penggerak & CVT', 'Roller weight original Yamaha YGP (2DP-E7632-00) bobot 13 gram isi 6 pcs untuk NMAX 155 & Aerox 155'],
            ['CVT-014', 'Roller Set Astra Aspira Beat ESP 8.5g (Set 6pcs)', 38000, 'Penggerak & CVT', 'Roller weight set Astra Otoparts Aspira presisi dan tahan gesekan isi 6 pcs Beat ESP'],
            ['CVT-015', 'Roller Set Astra Aspira Mio M3 12g (Set 6pcs)', 38000, 'Penggerak & CVT', 'Roller weight set Astra Otoparts Aspira presisi dan tahan gesekan isi 6 pcs Mio M3'],

            // --- PER CVT (KHUSUS MATIC) ---
            ['CVT-016', 'Per CVT AHM Honda Beat ESP / Scoopy Original Standar', 35000, 'Penggerak & CVT', 'Pegas / spring driven face per CVT original Honda AHM (23233-GCC-000) Beat ESP, Scoopy, Genio'],
            ['CVT-017', 'Per CVT AHM Honda Vario 125 / 150 Original Standar', 40000, 'Penggerak & CVT', 'Pegas / spring driven face per CVT original Honda AHM (23233-KWN-901) Vario 125/150'],
            ['CVT-018', 'Per CVT YGP Yamaha Mio M3 / Fino Original Standar', 32000, 'Penggerak & CVT', 'Pegas / spring driven face per CVT original Yamaha YGP (90501-40801) Mio M3, Fino 125, Gear'],
            ['CVT-019', 'Per CVT YGP Yamaha NMAX 155 Original Standar', 42000, 'Penggerak & CVT', 'Pegas / spring driven face per CVT original Yamaha YGP (2DP-E7683-00) NMAX 155 & Aerox 155'],
            ['CVT-020', 'Per CVT Astra Aspira Beat ESP / Scoopy', 24000, 'Penggerak & CVT', 'Pegas per CVT standar elastisitas stabil Astra Otoparts Aspira Beat ESP'],
            ['CVT-021', 'Per CVT Astra Aspira Mio M3 / Soul GT', 24000, 'Penggerak & CVT', 'Pegas per CVT standar elastisitas stabil Astra Otoparts Aspira Mio M3'],

            // --- KAMPAS GANDA (CVT) (KHUSUS MATIC) ---
            ['CVT-022', 'Kampas Ganda AHM Honda Beat ESP / Scoopy Original', 165000, 'Penggerak & CVT', 'Kampas kopling ganda / weight clutch original Honda AHM (22535-K44-V00) untuk Beat ESP, Scoopy ESP, Genio'],
            ['CVT-023', 'Kampas Ganda AHM Honda Vario 125 / 150 Original', 185000, 'Penggerak & CVT', 'Kampas kopling ganda / weight clutch original Honda AHM (22535-KWN-900) untuk Vario 125 & Vario 150'],
            ['CVT-024', 'Kampas Ganda YGP Yamaha Mio M3 / Gear Original', 155000, 'Penggerak & CVT', 'Kampas kopling ganda original Yamaha YGP (2PH-E6620-00) untuk Mio M3, Soul GT 125, Fino 125, Gear 125'],
            ['CVT-025', 'Kampas Ganda YGP Yamaha NMAX 155 / Aerox Original', 195000, 'Penggerak & CVT', 'Kampas kopling ganda original Yamaha YGP (2DP-E6620-00) untuk NMAX 155 & Aerox 155'],
            ['CVT-026', 'Kampas Ganda Astra Aspira Beat ESP / Scoopy', 115000, 'Penggerak & CVT', 'Kampas kopling ganda assy Astra Otoparts Aspira anti selip Beat ESP & Scoopy'],
            ['CVT-027', 'Kampas Ganda Astra Aspira Mio M3 125', 110000, 'Penggerak & CVT', 'Kampas kopling ganda assy Astra Otoparts Aspira anti selip Mio M3 125'],

            // --- GEAR SET & RANTAI (KHUSUS BEBEK & SPORT) ---
            ['CVT-028', 'Gear Set + Rantai AHM Honda Supra X 125 / Blade 125 Original', 215000, 'Penggerak & CVT', 'Drive chain kit / paket gir depan + belakang + rantai original Honda AHM (06401-KPH-900) untuk Supra X 125 & Blade 125'],
            ['CVT-029', 'Gear Set + Rantai AHM Honda Revo Fit / Revo X Original', 195000, 'Penggerak & CVT', 'Drive chain kit original Honda AHM (06401-KWW-900) untuk Revo Fit & Revo Absolute'],
            ['CVT-030', 'Gear Set + Rantai AHM Honda CB150R StreetFire Original', 345000, 'Penggerak & CVT', 'Drive chain kit gir set 428-120L original Honda AHM (06401-K15-900) untuk CB150R & CBR150R'],
            ['CVT-031', 'Gear Set + Rantai YGP Yamaha Jupiter Z1 / Vega Force Original', 195000, 'Penggerak & CVT', 'Gear set paket gir depan, gir belakang + rantai original Yamaha YGP (1DY-WF01A-00) untuk Jupiter Z1 & Vega Force'],
            ['CVT-032', 'Gear Set + Rantai YGP Yamaha Vixion / R15 Original', 325000, 'Penggerak & CVT', 'Gear set paket gir depan, gir belakang + rantai original Yamaha YGP (3C1-W001A-00) untuk Yamaha Vixion & R15'],
            ['CVT-033', 'Gear Set + Rantai Astra Aspira Supra X 125', 145000, 'Penggerak & CVT', 'Drive chain kit paket gir depan, gir belakang + rantai Astra Otoparts Aspira kuat & presisi Supra X 125'],
            ['CVT-034', 'Gear Set + Rantai Astra Aspira Revo Fit', 135000, 'Penggerak & CVT', 'Drive chain kit paket gir depan, gir belakang + rantai Astra Otoparts Aspira kuat & presisi Revo Fit'],
            ['CVT-035', 'Gear Set + Rantai Astra Aspira Jupiter Z1', 140000, 'Penggerak & CVT', 'Drive chain kit paket gir depan, gir belakang + rantai Astra Otoparts Aspira untuk Jupiter Z1'],
            ['CVT-036', 'Gear Set + Rantai Astra Aspira Vixion / CB150R (428-120L)', 235000, 'Penggerak & CVT', 'Drive chain kit paket gir depan, gir belakang + rantai Astra Otoparts Aspira untuk Vixion & CB150R'],

            // --- RANTAI SAJA (KHUSUS BEBEK & SPORT) ---
            ['CVT-037', 'Rantai Roda Astra Aspira 428-104L (Bebek)', 65000, 'Penggerak & CVT', 'Rantai roda sepeda motor Astra Otoparts Aspira ukuran 428 panjang 104 mata untuk Supra X 125, Revo, Jupiter Z1, Vega'],
            ['CVT-038', 'Rantai Roda Astra Aspira 428-120L (Sport)', 85000, 'Penggerak & CVT', 'Rantai roda sepeda motor Astra Otoparts Aspira ukuran 428 panjang 120 mata untuk CB150R, Vixion, CBR150R, R15, MX King'],
            ['CVT-039', 'Rantai Roda AHM Honda 428-106L Original (Bebek Honda)', 95000, 'Penggerak & CVT', 'Rantai roda original Honda AHM ukuran 428 panjang 106 mata untuk Supra X 125, Revo, Blade'],

            // --- KAMPAS KOPLING (KHUSUS BEBEK & SPORT) ---
            ['CVT-040', 'Kampas Kopling AHM Honda Supra X 125 / Revo (Set)', 115000, 'Penggerak & CVT', 'Plat gesek kampas kopling original Honda AHM (22201-KPH-900) isi 4 keping untuk Supra X 125 & Revo'],
            ['CVT-041', 'Kampas Kopling AHM Honda CB150R / CBR150R (Set)', 165000, 'Penggerak & CVT', 'Plat gesek kampas kopling original Honda AHM (22201-K15-900) isi 5 keping untuk CB150R & CBR150R'],
            ['CVT-042', 'Kampas Kopling YGP Yamaha Jupiter Z1 / Vega (Set)', 110000, 'Penggerak & CVT', 'Plat gesek kampas kopling original Yamaha YGP (5TP-E6321-00) isi 4 keping untuk Jupiter Z1, Jupiter MX, Vega'],
            ['CVT-043', 'Kampas Kopling YGP Yamaha Vixion / R15 / MX King (Set)', 155000, 'Penggerak & CVT', 'Plat gesek kampas kopling original Yamaha YGP (3C1-E6321-00) isi 5 keping untuk Vixion, R15, MX King 150'],
            ['CVT-044', 'Kampas Kopling Astra Aspira Supra X 125 (Set)', 85000, 'Penggerak & CVT', 'Kampas kopling set Astra Otoparts Aspira transfer tenaga responsif untuk Supra X 125 & Revo'],
            ['CVT-045', 'Kampas Kopling Astra Aspira Jupiter Z1 (Set)', 80000, 'Penggerak & CVT', 'Kampas kopling set Astra Otoparts Aspira transfer tenaga responsif untuk Jupiter Z1 & Vega'],
            ['CVT-046', 'Kampas Kopling Astra Aspira Vixion / CB150R (Set)', 115000, 'Penggerak & CVT', 'Kampas kopling set Astra Otoparts Aspira transfer tenaga responsif untuk Vixion & CB150R'],

            // --- KABEL KOPLING (KHUSUS SPORT & MANUAL CLUTCH) ---
            ['CVT-047', 'Kabel Kopling AHM Honda CB150R StreetFire Original', 48000, 'Aksesoris', 'Kabel tali kopling clutch cable original Honda AHM (22870-K15-900) untuk Honda CB150R'],
            ['CVT-048', 'Kabel Kopling AHM Honda CBR150R / Sonic 150R Original', 50000, 'Aksesoris', 'Kabel tali kopling clutch cable original Honda AHM (22870-K45-N00) untuk CBR150R & Sonic 150R'],
            ['CVT-049', 'Kabel Kopling YGP Yamaha Vixion Original', 45000, 'Aksesoris', 'Kabel tali kopling clutch cable original Yamaha YGP (3C1-F6335-00) untuk Yamaha Vixion'],
            ['CVT-050', 'Kabel Kopling YGP Yamaha R15 / MX King Original', 48000, 'Aksesoris', 'Kabel tali kopling clutch cable original Yamaha YGP (2PK-F6335-00) untuk Yamaha R15 & MX King 150'],
            ['CVT-051', 'Kabel Kopling Astra Aspira CB150R / CBR150R', 30000, 'Aksesoris', 'Kabel tali kopling Astra Otoparts Aspira tarikan enteng dan awet untuk Honda CB150R'],
            ['CVT-052', 'Kabel Kopling Astra Aspira Vixion / R15', 28000, 'Aksesoris', 'Kabel tali kopling Astra Otoparts Aspira tarikan enteng dan awet untuk Yamaha Vixion'],

            // =========================================================================
            // ================= 5. KELISTRIKAN & PENGAPIAN ============================
            // =========================================================================
            // --- AKI / BATTERY ---
            ['ELC-001', 'Aki GS Battery / GS Astra GTZ5S (Matic & Bebek Standar)', 225000, 'Aki & Kelistrikan', 'Aki kering MF GS Astra GTZ5S 12V 3.5Ah original untuk Beat, Scoopy, Vario 110, Mio M3, Vixion, Supra X 125, Revo, Jupiter Z1'],
            ['ELC-002', 'Aki Yuasa YTZ5S (Matic & Bebek Standar)', 205000, 'Aki & Kelistrikan', 'Aki kering MF Yuasa YTZ5S 12V 3.5Ah original pabrikan untuk Beat, Mio Soul, Scoopy, Vixion, Supra X 125, Jupiter Z1'],
            ['ELC-003', 'Aki GS Battery / GS Astra GTZ6V (Matic ISS / Maxi)', 315000, 'Aki & Kelistrikan', 'Aki kering MF GS Astra GTZ6V 12V 5Ah untuk Vario 125/150/160, PCX 150/160, ADV 150/160, NMAX 155, Aerox 155, Scoopy Smartkey'],
            ['ELC-004', 'Aki Yuasa YTZ6V (Matic ISS / Maxi)', 285000, 'Aki & Kelistrikan', 'Aki kering MF Yuasa YTZ6V 12V 5Ah untuk motor ISS Vario 125/150, PCX 150, NMAX 155, Aerox 155'],
            ['ELC-005', 'Aki GS Battery / GS Astra GTZ7S (Sport 150cc)', 365000, 'Aki & Kelistrikan', 'Aki kering MF GS Astra GTZ7S 12V 6Ah daya starter tinggi untuk CB150R, CBR150R, CRF150L, KLX 150'],

            // --- BUSI ---
            ['ELC-006', 'Busi AHM Honda CPR9EA-9 (Beat/Vario 110/Scoopy/Genio)', 28000, 'Aki & Kelistrikan', 'Busi original Honda AHM kode CPR9EA-9 untuk seluruh matic Honda Beat, Scoopy, Genio, Vario 110'],
            ['ELC-007', 'Busi AHM Honda CPR6EA-9 (Vario 125/150/160 & PCX)', 28000, 'Aki & Kelistrikan', 'Busi original Honda AHM kode CPR6EA-9 untuk Vario 125, Vario 150, Vario 160, PCX 150/160, ADV'],
            ['ELC-008', 'Busi AHM Honda CPR7EA-9 (Supra X 125/Blade/Revo)', 28000, 'Aki & Kelistrikan', 'Busi original Honda AHM kode CPR7EA-9 untuk Supra X 125 FI, Blade 125, Revo FI'],
            ['ELC-009', 'Busi AHM Honda CPR8EA-9 (CB150R/CBR150R/Sonic)', 30000, 'Aki & Kelistrikan', 'Busi original Honda AHM kode CPR8EA-9 untuk CB150R Streetfire, CBR150R, Sonic 150R, Supra GTR'],
            ['ELC-010', 'Busi YGP Yamaha CR6HSA (Mio/Fino/Vega/Jupiter Z)', 25000, 'Aki & Kelistrikan', 'Busi original Yamaha YGP kode CR6HSA untuk Mio Karbu, Mio J, Fino, Vega ZR, Jupiter Z'],
            ['ELC-011', 'Busi YGP Yamaha CR6HSA (Mio M3/Gear/Fazzio)', 25000, 'Aki & Kelistrikan', 'Busi original Yamaha YGP kode CR6HSA untuk Mio M3 125, Gear 125, Freego, Fazzio, Jupiter Z1'],
            ['ELC-012', 'Busi YGP Yamaha CPR8EA-9 (NMAX/Aerox/Vixion/R15/MX King)', 28000, 'Aki & Kelistrikan', 'Busi original Yamaha YGP kode CPR8EA-9 untuk NMAX 155, Aerox 155, Vixion, R15, MX King 150'],
            ['ELC-013', 'Busi Astra Aspira CPR9EA-9 (Honda Matic)', 20000, 'Aki & Kelistrikan', 'Busi Astra Otoparts Aspira kualitas standar pabrikan tipe CPR9EA-9 untuk Beat, Scoopy, Genio'],
            ['ELC-014', 'Busi Astra Aspira CPR7EA-9 / C7HSA (Bebek Honda & Yamaha)', 18000, 'Aki & Kelistrikan', 'Busi Astra Otoparts Aspira untuk Supra X 125, Revo, Jupiter Z, Vega'],
            ['ELC-015', 'Busi Astra Aspira CR6HSA (Yamaha Matic)', 18000, 'Aki & Kelistrikan', 'Busi Astra Otoparts Aspira untuk Mio M3, Gear 125, Fino 125'],

            // --- KIPROK / REGULATOR ---
            ['ELC-016', 'Kiprok Regulator Rectifier AHM Honda Beat ESP / Scoopy Original', 185000, 'Aki & Kelistrikan', 'Kiprok regulator pengisian aki original Honda AHM (31600-K44-V01) untuk Beat ESP & Scoopy ESP'],
            ['ELC-017', 'Kiprok Regulator Rectifier AHM Honda Supra X 125 / Revo Original', 175000, 'Aki & Kelistrikan', 'Kiprok regulator pengisian aki original Honda AHM (31600-KWW-641) untuk Supra X 125 & Revo Fit'],
            ['ELC-018', 'Kiprok Regulator Rectifier YGP Yamaha Mio M3 / Fino Original', 175000, 'Aki & Kelistrikan', 'Kiprok regulator pengisian aki original Yamaha YGP (2PH-H1960-00) untuk Mio M3 & Fino 125'],
            ['ELC-019', 'Kiprok Regulator Rectifier YGP Yamaha Jupiter Z1 / Vega Force Original', 165000, 'Aki & Kelistrikan', 'Kiprok regulator pengisian aki original Yamaha YGP (1DY-H1960-00) untuk Jupiter Z1 & Vega Force'],
            ['ELC-020', 'Kiprok Regulator Rectifier Astra Aspira Beat / Vario', 115000, 'Aki & Kelistrikan', 'Kiprok regulator pengisian stabil Astra Otoparts Aspira untuk Honda Beat & Vario'],
            ['ELC-021', 'Kiprok Regulator Rectifier Astra Aspira Supra X 125 / Revo', 110000, 'Aki & Kelistrikan', 'Kiprok regulator pengisian stabil Astra Otoparts Aspira untuk Honda Supra X 125 & Revo'],
            ['ELC-022', 'Kiprok Regulator Rectifier Astra Aspira Mio / Jupiter Z', 105000, 'Aki & Kelistrikan', 'Kiprok regulator pengisian stabil Astra Otoparts Aspira untuk Yamaha Mio & Jupiter Z'],

            // --- CDI / ECU ---
            ['ELC-023', 'ECU ECM Engine Control Unit AHM Honda Beat ESP Original', 425000, 'Aki & Kelistrikan', 'Komputer ECU / ECM injeksi original Honda AHM (30400-K81-N02) untuk Beat ESP'],
            ['ELC-024', 'ECU ECM Engine Control Unit AHM Honda Supra X 125 FI Original', 395000, 'Aki & Kelistrikan', 'Komputer ECU / ECM injeksi original Honda AHM (38770-K41-N01) untuk Supra X 125 FI'],
            ['ELC-025', 'ECU ECM Engine Control Unit YGP Yamaha Mio M3 125 Original', 395000, 'Aki & Kelistrikan', 'Komputer ECU / ECM injeksi original Yamaha YGP (2PH-H591A-00) untuk Mio M3 125'],
            ['ELC-026', 'ECU ECM Engine Control Unit YGP Yamaha Jupiter Z1 Original', 385000, 'Aki & Kelistrikan', 'Komputer ECU / ECM injeksi original Yamaha YGP (1DY-H591A-00) untuk Jupiter Z1'],
            ['ELC-027', 'CDI Unit Pengapian Astra Aspira Supra Lama / Grand (Karbu)', 85000, 'Aki & Kelistrikan', 'CDI unit pengapian standar Astra Otoparts Aspira kurva api presisi untuk Supra Fit / Grand / Legenda'],
            ['ELC-028', 'CDI Unit Pengapian Astra Aspira Mio Sporty / Smile (Karbu)', 95000, 'Aki & Kelistrikan', 'CDI unit pengapian standar Astra Otoparts Aspira kurva api presisi untuk Mio Karbu / Soul Karbu'],

            // --- KOIL PENGAPIAN ---
            ['ELC-029', 'Koil Pengapian Ignition Coil AHM Honda Beat ESP / Scoopy Original', 95000, 'Aki & Kelistrikan', 'Koil pengapian busi original Honda AHM (30510-K25-901) untuk Beat FI, Beat ESP, Scoopy, Genio'],
            ['ELC-030', 'Koil Pengapian Ignition Coil AHM Honda Supra X 125 / Revo Original', 90000, 'Aki & Kelistrikan', 'Koil pengapian busi original Honda AHM (30510-KWW-641) untuk Supra X 125 FI & Revo FI'],
            ['ELC-031', 'Koil Pengapian Ignition Coil YGP Yamaha Mio M3 / Fino Original', 90000, 'Aki & Kelistrikan', 'Koil pengapian busi original Yamaha YGP (2PH-H2310-00) untuk Mio M3, Mio J, Fino 125'],
            ['ELC-032', 'Koil Pengapian Ignition Coil YGP Yamaha Jupiter Z1 / Vega Original', 85000, 'Aki & Kelistrikan', 'Koil pengapian busi original Yamaha YGP (1DY-H2310-00) untuk Jupiter Z1 & Vega Force'],
            ['ELC-033', 'Koil Pengapian Astra Aspira Honda Matic & Bebek', 65000, 'Aki & Kelistrikan', 'Koil pengapian busi Astra Otoparts Aspira tegangan api stabil untuk Beat & Supra X 125'],
            ['ELC-034', 'Koil Pengapian Astra Aspira Yamaha Matic & Bebek', 62000, 'Aki & Kelistrikan', 'Koil pengapian busi Astra Otoparts Aspira tegangan api stabil untuk Mio & Jupiter Z1'],

            // --- DINAMO STARTER ---
            ['ELC-035', 'Dinamo Starter Motor Assy AHM Honda Beat ESP / Scoopy Original', 285000, 'Aki & Kelistrikan', 'Motor starter dinamo starter original Honda AHM (31210-K44-V01) untuk Beat ESP & Scoopy ESP'],
            ['ELC-036', 'Dinamo Starter Motor Assy AHM Honda Supra X 125 / Revo Original', 265000, 'Aki & Kelistrikan', 'Motor starter dinamo starter original Honda AHM (31210-KPH-881) untuk Supra X 125 & Revo Fit'],
            ['ELC-037', 'Dinamo Starter Motor Assy YGP Yamaha Mio M3 125 Original', 270000, 'Aki & Kelistrikan', 'Motor starter dinamo starter original Yamaha YGP (2PH-H1800-00) untuk Mio M3, Soul GT, Fino 125'],
            ['ELC-038', 'Dinamo Starter Motor Assy YGP Yamaha Jupiter Z1 / Vega Original', 255000, 'Aki & Kelistrikan', 'Motor starter dinamo starter original Yamaha YGP (5TP-H1800-00) untuk Jupiter Z1 & Vega Force'],
            ['ELC-039', 'Dinamo Starter Motor Assy Astra Aspira Beat ESP', 185000, 'Aki & Kelistrikan', 'Motor starter dinamo assy Astra Otoparts Aspira putaran enteng & kuat untuk Honda Beat ESP'],
            ['ELC-040', 'Dinamo Starter Motor Assy Astra Aspira Supra X 125', 175000, 'Aki & Kelistrikan', 'Motor starter dinamo assy Astra Otoparts Aspira untuk Honda Supra X 125'],
            ['ELC-041', 'Dinamo Starter Motor Assy Astra Aspira Mio M3 / Jupiter Z', 175000, 'Aki & Kelistrikan', 'Motor starter dinamo assy Astra Otoparts Aspira untuk Yamaha Mio & Jupiter Z'],

            // --- BENDIK / RELAY STARTER ---
            ['ELC-042', 'Bendik Relay Starter AHM Honda Beat / Vario / Scoopy Original', 55000, 'Aki & Kelistrikan', 'Relay starter magnetic switch original Honda AHM (38501-KVZ-631) untuk Beat, Vario, Scoopy, Genio'],
            ['ELC-043', 'Bendik Relay Starter AHM Honda Supra X 125 / Revo Original', 50000, 'Aki & Kelistrikan', 'Relay starter magnetic switch original Honda AHM (38501-KPH-901) untuk Supra X 125 & Revo Fit'],
            ['ELC-044', 'Bendik Relay Starter YGP Yamaha Mio M3 / Fino / NMAX Original', 52000, 'Aki & Kelistrikan', 'Relay starter magnetic switch original Yamaha YGP (5TP-H1940-00) untuk Mio, Fino, NMAX, Aerox'],
            ['ELC-045', 'Bendik Relay Starter YGP Yamaha Jupiter Z1 / Vega Original', 48000, 'Aki & Kelistrikan', 'Relay starter magnetic switch original Yamaha YGP (4ST-H1940-00) untuk Jupiter Z1 & Vega'],
            ['ELC-046', 'Bendik Relay Starter Astra Aspira Universal Honda & Yamaha', 35000, 'Aki & Kelistrikan', 'Relay starter Astra Otoparts Aspira penghantar arus kuat kontak tahan panas untuk semua motor'],

            // =========================================================================
            // ================= 6. LAMPU & SAKLAR =====================================
            // =========================================================================
            // --- LAMPU DEPAN (HEADLIGHT) ---
            ['LMP-001', 'Bohlam Lampu Depan AHM Stanley 12V 35/35W Original (Honda)', 38000, 'Aki & Kelistrikan', 'Bohlam lampu utama depan original Honda AHM Stanley 12V 35/35W untuk Beat, Vario, Scoopy, Supra X 125, Revo'],
            ['LMP-002', 'Bohlam Lampu Depan YGP Yamaha Halogen 12V 35/35W Original (Yamaha)', 35000, 'Aki & Kelistrikan', 'Bohlam lampu utama depan original Yamaha YGP Halogen 12V 35/35W untuk Mio, Fino, Jupiter Z1, Vega'],
            ['LMP-003', 'Bohlam Lampu Depan Astra Aspira Halogen 12V 35/35W', 25000, 'Aki & Kelistrikan', 'Bohlam lampu utama depan Astra Aspira kaki 1 halogen 12V 35W terang dan fokus untuk semua motor'],

            // --- LAMPU BELAKANG (TAILLIGHT) ---
            ['LMP-004', 'Bohlam Lampu Belakang / Rem AHM Stanley 12V 18/5W Original (Honda)', 18000, 'Aki & Kelistrikan', 'Bohlam lampu rem belakang original Honda AHM Stanley 12V 18/5W untuk seluruh motor Honda'],
            ['LMP-005', 'Bohlam Lampu Belakang / Rem Astra Aspira 12V 21/5W (Kaki 2)', 12000, 'Aki & Kelistrikan', 'Bohlam lampu rem belakang Astra Aspira 12V bayonet kaki 2 awet untuk motor Honda & Yamaha'],

            // --- LAMPU SEIN ---
            ['LMP-006', 'Bohlam Lampu Sein AHM Stanley 12V 10W Original (T13 Honda)', 12000, 'Aki & Kelistrikan', 'Bohlam lampu riting/sein tancap original Honda AHM Stanley 12V 10W untuk motor Honda'],
            ['LMP-007', 'Bohlam Lampu Sein Astra Aspira 12V 10W (T10 / T13)', 8000, 'Aki & Kelistrikan', 'Bohlam lampu riting/sein Astra Aspira tancap 12V awet untuk Honda & Yamaha'],

            // --- SAKLAR / SWITCH ---
            ['LMP-008', 'Saklar Tombol Switch Starter / Dimmer AHM Honda Beat / Scoopy / Supra', 25000, 'Aksesoris', 'Tombol saklar starter & lampu jauh/dekat original Honda AHM (35160-K81-N01) untuk Beat, Scoopy, Supra X 125'],
            ['LMP-009', 'Saklar Tombol Switch Klakson / Sein YGP Yamaha Mio / Jupiter Z1', 24000, 'Aksesoris', 'Tombol saklar klakson & lampu sein original Yamaha YGP (5TL-H3973-00) untuk Mio, Fino, Jupiter Z1'],
            ['LMP-010', 'Saklar Switch Rem Depan & Belakang Astra Aspira', 18000, 'Aksesoris', 'Switch stop saklar lampu rem depan belakang Astra Otoparts Aspira untuk semua motor'],

            // --- KLAKSON ---
            ['LMP-011', 'Klakson 12V High Tone AHM Honda Beat / Vario / Supra Original', 58000, 'Aksesoris', 'Klakson trompet basah/kering 12V original Honda AHM (38110-K81-N01) untuk Beat, Vario, Supra X 125, CB150R'],
            ['LMP-012', 'Klakson 12V YGP Yamaha Mio / Jupiter / NMAX Original', 55000, 'Aksesoris', 'Klakson standar 12V original Yamaha YGP (1WD-H3371-00) untuk Mio, Jupiter Z1, NMAX, Vixion'],
            ['LMP-013', 'Klakson 12V Astra Aspira Universal Suara Nyaring', 38000, 'Aksesoris', 'Klakson piringan 12V Astra Otoparts Aspira suara nyaring tahan air untuk semua motor'],

            // =========================================================================
            // ================= 7. MESIN & FILTER =====================================
            // =========================================================================
            // --- FILTER UDARA ---
            ['FLT-001', 'Filter Udara AHM Honda Beat ESP / Scoopy ESP Original', 65000, 'Filter & Konsumsi', 'Saringan udara / air cleaner element original Honda AHM (17210-K44-V00) untuk Beat ESP, Beat Street, Scoopy ESP'],
            ['FLT-002', 'Filter Udara AHM Honda Vario 125 / 150 eSP Original', 70000, 'Filter & Konsumsi', 'Saringan udara original Honda AHM (17210-K59-A10) untuk Vario 125 & Vario 150 eSP'],
            ['FLT-003', 'Filter Udara AHM Honda Supra X 125 FI / Helm-in Original', 58000, 'Filter & Konsumsi', 'Saringan udara original Honda AHM (17210-KYZ-900) untuk Supra X 125 Helm-in & FI'],
            ['FLT-004', 'Filter Udara AHM Honda CB150R StreetFire / CBR150R Original', 75000, 'Filter & Konsumsi', 'Saringan udara original Honda AHM (17211-K15-900) untuk CB150R & CBR150R'],
            ['FLT-005', 'Filter Udara YGP Yamaha Mio M3 125 / Fino 125 Original', 55000, 'Filter & Konsumsi', 'Saringan udara original Yamaha YGP (2PH-E4451-00) untuk Mio M3 125, Soul GT 125, Fino 125'],
            ['FLT-006', 'Filter Udara YGP Yamaha NMAX 155 (Old) Original', 58000, 'Filter & Konsumsi', 'Saringan udara original Yamaha YGP (2DP-E4451-00) untuk Yamaha NMAX 155 Old'],
            ['FLT-007', 'Filter Udara YGP Yamaha Jupiter Z1 / Vega Force Original', 52000, 'Filter & Konsumsi', 'Saringan udara original Yamaha YGP (1DY-E4450-00) untuk Jupiter Z1 & Vega Force'],
            ['FLT-008', 'Filter Udara YGP Yamaha Vixion (NVL / NVA) Original', 65000, 'Filter & Konsumsi', 'Saringan udara original Yamaha YGP (1PA-E4450-00) untuk Yamaha Vixion Lightning & Advance'],
            ['FLT-009', 'Filter Udara Astra Aspira Beat ESP (K44)', 38000, 'Filter & Konsumsi', 'Saringan udara Astra Otoparts Aspira filtrasi debu optimal untuk Honda Beat ESP & Scoopy ESP'],
            ['FLT-013', 'Filter Udara Astra Aspira Supra X 125', 35000, 'Filter & Konsumsi', 'Saringan udara Astra Otoparts Aspira untuk Honda Supra X 125'],
            ['FLT-014', 'Filter Udara Astra Aspira Mio M3 125', 35000, 'Filter & Konsumsi', 'Saringan udara Astra Otoparts Aspira untuk Yamaha Mio M3 125'],
            ['FLT-015', 'Filter Udara Astra Aspira Jupiter Z1', 32000, 'Filter & Konsumsi', 'Saringan udara Astra Otoparts Aspira untuk Yamaha Jupiter Z1'],

            // --- FILTER OLI MESIN ---
            ['FLT-016', 'Filter Saringan Oli Mesin AHM Honda CB150R / CBR150R Original', 42000, 'Filter & Konsumsi', 'Saringan oli mesin cartridge original Honda AHM (15412-MGS-D21) untuk CB150R, CBR150R, CRF150L'],
            ['FLT-017', 'Filter Saringan Oli Mesin YGP Yamaha Vixion / R15 / Jupiter MX Original', 38000, 'Filter & Konsumsi', 'Saringan oli mesin original Yamaha YGP (38B-E3440-00) untuk Vixion, R15, Jupiter MX, MX King 150'],
            ['FLT-018', 'Filter Saringan Oli Mesin Astra Aspira Vixion / CB150R', 26000, 'Filter & Konsumsi', 'Filter oli mesin kertas lipat rapat Astra Otoparts Aspira untuk Vixion, CB150R, R15, MX King'],

            // --- KARBURATOR / REPAIR KIT ---
            ['MSN-001', 'Repair Kit Karburator AHM Honda Supra Fit / Grand / Supra X Lama Original', 45000, 'Penggerak & CVT', 'Repair kit spuyer jarum pelampung karburator original Honda AHM untuk Supra Fit, Grand, Supra X 100/125 Karbu'],
            ['MSN-002', 'Repair Kit Karburator AHM Honda Beat Karbu / Scoopy Karbu Original', 48000, 'Penggerak & CVT', 'Repair kit spuyer jarum karburator original Honda AHM untuk Beat Karbu & Scoopy Karbu'],
            ['MSN-003', 'Repair Kit Karburator YGP Yamaha Mio Sporty / Smile Karbu Original', 42000, 'Penggerak & CVT', 'Repair kit spuyer jarum karburator original Yamaha YGP untuk Mio Karbu, Soul Karbu, Fino Karbu'],
            ['MSN-004', 'Repair Kit Karburator YGP Yamaha Jupiter Z / Vega R Karbu Original', 42000, 'Penggerak & CVT', 'Repair kit spuyer jarum karburator original Yamaha YGP untuk Jupiter Z Karbu & Vega R'],
            ['MSN-005', 'Repair Kit Karburator Astra Aspira Beat Karbu / Supra Fit', 30000, 'Penggerak & CVT', 'Repair kit karburator presisi Astra Otoparts Aspira untuk Beat Karbu & Supra Fit'],
            ['MSN-006', 'Repair Kit Karburator Astra Aspira Mio Karbu / Jupiter Z', 30000, 'Penggerak & CVT', 'Repair kit karburator presisi Astra Otoparts Aspira untuk Mio Karbu & Jupiter Z'],

            // --- INJEKTOR ---
            ['MSN-007', 'Injektor Bahan Bakar Fuel Injector AHM Honda Beat ESP / Scoopy Original', 185000, 'Penggerak & CVT', 'Fuel injector nozzle pengabut bensin original Honda AHM (16450-K44-V01) untuk Beat ESP & Scoopy ESP'],
            ['MSN-008', 'Injektor Bahan Bakar Fuel Injector AHM Honda Supra X 125 FI Original', 175000, 'Penggerak & CVT', 'Fuel injector nozzle pengabut bensin original Honda AHM (16450-KWW-641) untuk Supra X 125 FI & Revo FI'],
            ['MSN-009', 'Injektor Bahan Bakar Fuel Injector YGP Yamaha Mio M3 125 Original', 175000, 'Penggerak & CVT', 'Fuel injector nozzle pengabut bensin original Yamaha YGP (2PH-E3770-00) untuk Mio M3, Soul GT 125, Fino 125'],
            ['MSN-010', 'Injektor Bahan Bakar Fuel Injector YGP Yamaha Jupiter Z1 Original', 165000, 'Penggerak & CVT', 'Fuel injector nozzle pengabut bensin original Yamaha YGP (1DY-E3770-00) untuk Jupiter Z1 & Vega Force'],
            ['MSN-011', 'Cairan Pembersih Injektor Astra Aspira Injector Cleaner 60ml', 28000, 'Filter & Konsumsi', 'Cairan pembersih kerak deposit injektor bensin Astra Otoparts Aspira untuk semua motor injeksi'],

            // --- PISTON & RING ---
            ['MSN-012', 'Piston Kit + Ring Piston AHM Honda Beat ESP Std (Set)', 155000, 'Penggerak & CVT', 'Piston seher + ring piston + pen original Honda AHM (13101-K44-V00) Std untuk Beat ESP & Scoopy ESP'],
            ['MSN-013', 'Piston Kit + Ring Piston AHM Honda Supra X 125 Std (Set)', 145000, 'Penggerak & CVT', 'Piston seher + ring piston + pen original Honda AHM (13101-KPH-880) Std untuk Supra X 125'],
            ['MSN-014', 'Piston Kit + Ring Piston YGP Yamaha Mio M3 125 Std (Set)', 145000, 'Penggerak & CVT', 'Piston seher + ring piston + pen original Yamaha YGP (2PH-E1630-00) Std untuk Mio M3 125'],
            ['MSN-015', 'Piston Kit + Ring Piston YGP Yamaha Jupiter Z1 Std (Set)', 140000, 'Penggerak & CVT', 'Piston seher + ring piston + pen original Yamaha YGP (1DY-E1630-00) Std untuk Jupiter Z1'],
            ['MSN-016', 'Piston Kit + Ring Piston Astra Aspira Beat ESP Std', 115000, 'Penggerak & CVT', 'Piston kit presisi Astra Otoparts Aspira kompresi padat awet untuk Beat ESP'],
            ['MSN-017', 'Piston Kit + Ring Piston Astra Aspira Supra X 125 Std', 115000, 'Penggerak & CVT', 'Piston kit presisi Astra Otoparts Aspira kompresi padat awet untuk Supra X 125'],
            ['MSN-018', 'Piston Kit + Ring Piston Astra Aspira Mio M3 / Jupiter Z1 Std', 110000, 'Penggerak & CVT', 'Piston kit presisi Astra Otoparts Aspira untuk Mio M3 & Jupiter Z1'],

            // --- NOKEN AS / CAMSHAFT ---
            ['MSN-019', 'Noken As Camshaft Assy AHM Honda Beat ESP / Scoopy Original', 185000, 'Penggerak & CVT', 'Poros bubungan noken as camshaft original Honda AHM (14100-K44-V00) untuk Beat ESP & Scoopy ESP'],
            ['MSN-020', 'Noken As Camshaft Assy AHM Honda Supra X 125 Original', 175000, 'Penggerak & CVT', 'Poros bubungan noken as camshaft original Honda AHM (14100-KPH-900) untuk Supra X 125'],
            ['MSN-021', 'Noken As Camshaft Assy YGP Yamaha Mio M3 125 Original', 175000, 'Penggerak & CVT', 'Poros bubungan noken as camshaft original Yamaha YGP (2PH-E2170-00) untuk Mio M3 125'],
            ['MSN-022', 'Noken As Camshaft Assy YGP Yamaha Jupiter Z1 Original', 165000, 'Penggerak & CVT', 'Poros bubungan noken as camshaft original Yamaha YGP (1DY-E2170-00) untuk Jupiter Z1'],
            ['MSN-023', 'Noken As Camshaft Astra Aspira Beat ESP', 135000, 'Penggerak & CVT', 'Noken as camshaft baja tempa presisi Astra Otoparts Aspira untuk Beat ESP'],
            ['MSN-024', 'Noken As Camshaft Astra Aspira Supra X 125', 130000, 'Penggerak & CVT', 'Noken as camshaft baja tempa presisi Astra Otoparts Aspira untuk Supra X 125'],
            ['MSN-025', 'Noken As Camshaft Astra Aspira Mio M3 / Jupiter Z', 125000, 'Penggerak & CVT', 'Noken as camshaft baja tempa presisi Astra Otoparts Aspira untuk Mio M3 & Jupiter Z'],

            // --- KLEP / VALVE ---
            ['MSN-026', 'Klep Minyak In & Ex AHM Honda Beat ESP / Scoopy (Sepasang)', 85000, 'Penggerak & CVT', 'Katup klep masuk (In) dan buang (Ex) original Honda AHM (14711-K44-V00) untuk Beat ESP & Scoopy ESP'],
            ['MSN-027', 'Klep Minyak In & Ex AHM Honda Supra X 125 (Sepasang)', 80000, 'Penggerak & CVT', 'Katup klep masuk (In) dan buang (Ex) original Honda AHM (14711-KPH-900) untuk Supra X 125 & Revo'],
            ['MSN-028', 'Klep Minyak In & Ex YGP Yamaha Mio M3 125 (Sepasang)', 80000, 'Penggerak & CVT', 'Katup klep masuk (In) dan buang (Ex) original Yamaha YGP (2PH-E2111-00) untuk Mio M3 125 & Fino 125'],
            ['MSN-029', 'Klep Minyak In & Ex YGP Yamaha Jupiter Z1 (Sepasang)', 75000, 'Penggerak & CVT', 'Katup klep masuk (In) dan buang (Ex) original Yamaha YGP (1DY-E2111-00) untuk Jupiter Z1 & Vega Force'],
            ['MSN-030', 'Klep Minyak In & Ex Astra Aspira Beat ESP (Sepasang)', 55000, 'Penggerak & CVT', 'Katup klep masuk & buang tahan panas Astra Otoparts Aspira untuk Beat ESP'],
            ['MSN-031', 'Klep Minyak In & Ex Astra Aspira Supra X 125 (Sepasang)', 55000, 'Penggerak & CVT', 'Katup klep masuk & buang tahan panas Astra Otoparts Aspira untuk Supra X 125'],
            ['MSN-032', 'Klep Minyak In & Ex Astra Aspira Mio M3 / Jupiter Z1 (Sepasang)', 52000, 'Penggerak & CVT', 'Katup klep masuk & buang tahan panas Astra Otoparts Aspira untuk Mio M3 & Jupiter Z1'],

            // --- RANTAI KETENG / CAM CHAIN ---
            ['MSN-033', 'Rantai Keteng Cam Chain AHM Honda Beat ESP / Scoopy Original', 75000, 'Penggerak & CVT', 'Rantai mesin / rantai keteng original Honda AHM (14401-K44-V01) untuk Beat ESP & Scoopy ESP'],
            ['MSN-034', 'Rantai Keteng Cam Chain AHM Honda Supra X 125 Original', 70000, 'Penggerak & CVT', 'Rantai mesin / rantai keteng original Honda AHM (14401-KPH-901) untuk Supra X 125 & Revo'],
            ['MSN-035', 'Rantai Keteng Cam Chain YGP Yamaha Mio M3 125 Original', 70000, 'Penggerak & CVT', 'Rantai mesin / rantai keteng original Yamaha YGP (94568-A8090) untuk Mio M3 125 & Fino 125'],
            ['MSN-036', 'Rantai Keteng Cam Chain YGP Yamaha Jupiter Z1 Original', 65000, 'Penggerak & CVT', 'Rantai mesin / rantai keteng original Yamaha YGP (94568-H3090) untuk Jupiter Z1 & Vega Force'],
            ['MSN-037', 'Rantai Keteng Cam Chain Astra Aspira Beat ESP', 50000, 'Penggerak & CVT', 'Rantai keteng kamrat presisi Astra Otoparts Aspira anti mulur untuk Beat ESP'],
            ['MSN-038', 'Rantai Keteng Cam Chain Astra Aspira Supra X 125', 50000, 'Penggerak & CVT', 'Rantai keteng kamrat presisi Astra Otoparts Aspira anti mulur untuk Supra X 125'],
            ['MSN-039', 'Rantai Keteng Cam Chain Astra Aspira Mio M3 / Jupiter Z1', 48000, 'Penggerak & CVT', 'Rantai keteng kamrat presisi Astra Otoparts Aspira untuk Mio M3 & Jupiter Z1'],

            // --- GASKET / PACKING ---
            ['MSN-040', 'Gasket Paking Top Set Blok Mesin AHM Honda Beat ESP Original', 48000, 'Penggerak & CVT', 'Paking perpak set silinder blok & kop original Honda AHM (061A1-K44-V00) untuk Beat ESP & Scoopy ESP'],
            ['MSN-041', 'Gasket Paking Top Set Blok Mesin AHM Honda Supra X 125 Original', 45000, 'Penggerak & CVT', 'Paking perpak set silinder blok & kop original Honda AHM (061A1-KPH-880) untuk Supra X 125'],
            ['MSN-042', 'Gasket Paking Top Set Blok Mesin YGP Yamaha Mio M3 125 Original', 45000, 'Penggerak & CVT', 'Paking perpak set silinder blok & kop original Yamaha YGP (2PH-WE111-00) untuk Mio M3 125'],
            ['MSN-043', 'Gasket Paking Top Set Blok Mesin YGP Yamaha Jupiter Z1 Original', 42000, 'Penggerak & CVT', 'Paking perpak set silinder blok & kop original Yamaha YGP (1DY-WE111-00) untuk Jupiter Z1'],
            ['MSN-044', 'Gasket Paking Karter CVT Astra Aspira Beat ESP', 22000, 'Penggerak & CVT', 'Paking blok CVT karet berkualitas Astra Otoparts Aspira anti bocor oli untuk Beat ESP'],
            ['MSN-045', 'Gasket Paking Top Set Astra Aspira Supra X 125', 30000, 'Penggerak & CVT', 'Paking top set blok mesin Astra Otoparts Aspira untuk Supra X 125'],
            ['MSN-046', 'Gasket Paking Top Set Astra Aspira Mio M3 / Jupiter Z', 28000, 'Penggerak & CVT', 'Paking top set blok mesin Astra Otoparts Aspira untuk Mio M3 & Jupiter Z'],

            // =========================================================================
            // ================= 8. BODI & AKSESORIS ===================================
            // =========================================================================
            // --- SPION ---
            ['AKS-001', 'Spion Standar AHM Honda Beat / Scoopy / Supra (Sepasang)', 65000, 'Aksesoris', 'Kaca spion standar original Honda AHM drat 14 sepasang kanan & kiri untuk Beat, Scoopy, Vario, Supra X 125, Revo'],
            ['AKS-002', 'Spion Standar YGP Yamaha Mio / Jupiter / NMAX (Sepasang)', 60000, 'Aksesoris', 'Kaca spion standar original Yamaha YGP drat ulir balik sepasang kanan & kiri untuk Mio, Fino, Jupiter Z1, NMAX'],
            ['AKS-003', 'Spion Standar Astra Aspira Model Honda (Sepasang)', 45000, 'Aksesoris', 'Kaca spion standar Astra Otoparts Aspira tangkai kokoh pandangan jernih model Honda'],
            ['AKS-004', 'Spion Standar Astra Aspira Model Yamaha (Sepasang)', 45000, 'Aksesoris', 'Kaca spion standar Astra Otoparts Aspira tangkai kokoh pandangan jernih model Yamaha'],

            // --- HANDGRIP ---
            ['AKS-005', 'Handgrip Karet Stang AHM Honda Beat / Scoopy / Supra Original (Sepasang)', 35000, 'Aksesoris', 'Handgrip karet pegangan stang original Honda AHM (53166-K81-N00) sepasang untuk Beat, Scoopy, Supra X 125, Revo'],
            ['AKS-006', 'Handgrip Karet Stang YGP Yamaha Mio / Jupiter / NMAX Original (Sepasang)', 32000, 'Aksesoris', 'Handgrip karet pegangan stang original Yamaha YGP (54P-F6241-00) sepasang untuk Mio, Fino, Jupiter Z1, NMAX'],
            ['AKS-007', 'Handgrip Karet Stang Astra Aspira Universal Nyaman (Sepasang)', 22000, 'Aksesoris', 'Handgrip karet lembut anti selip Astra Otoparts Aspira universal untuk semua motor'],

            // --- HANDLE REM ---
            ['AKS-008', 'Handle Tuas Rem Kanan AHM Honda Beat / Scoopy / Vario 110/125/150 Original', 35000, 'Aksesoris', 'Handle tuas rem kanan original Honda AHM bahan aluminium kokoh presisi untuk Beat, Scoopy, Vario'],
            ['AKS-009', 'Handle Tuas Rem Kiri Combi Brake AHM Honda Beat / Scoopy / Vario CBS Original', 38000, 'Aksesoris', 'Handle tuas rem kiri CBS original Honda AHM untuk Beat CBS, Scoopy CBS, Vario CBS'],
            ['AKS-010', 'Handle Tuas Rem Kanan AHM Honda Supra X 125 / Revo Original', 35000, 'Aksesoris', 'Handle tuas rem kanan cakram original Honda AHM (53175-KET-921) untuk Supra X 125, Revo Fit, Blade'],
            ['AKS-011', 'Handle Tuas Rem Kanan YGP Yamaha Mio M3 / Fino / Gear Original', 36000, 'Aksesoris', 'Handle tuas rem kanan original Yamaha YGP (54P-H3922-00) untuk Mio M3, Mio J, Fino, Gear 125'],
            ['AKS-012', 'Handle Tuas Rem Kiri YGP Yamaha Mio M3 / Fino / Gear Original', 36000, 'Aksesoris', 'Handle tuas rem kiri tromol original Yamaha YGP (54P-H3912-00) untuk Mio M3, Mio J, Fino, Gear 125'],
            ['AKS-013', 'Handle Tuas Rem Kanan YGP Yamaha Jupiter Z1 / Vega Original', 34000, 'Aksesoris', 'Handle tuas rem kanan cakram original Yamaha YGP (5TP-H3922-00) untuk Jupiter Z1, Vega Force, Vega ZR'],
            ['AKS-014', 'Handle Tuas Rem Astra Aspira Beat / Vario', 25000, 'Aksesoris', 'Handle tuas rem aluminium cor Astra Otoparts Aspira presisi untuk Beat & Vario'],
            ['AKS-015', 'Handle Tuas Rem Astra Aspira Supra X 125 / Revo', 25000, 'Aksesoris', 'Handle tuas rem aluminium cor Astra Otoparts Aspira presisi untuk Supra X 125 & Revo'],
            ['AKS-016', 'Handle Tuas Rem Astra Aspira Mio / Jupiter Z', 24000, 'Aksesoris', 'Handle tuas rem aluminium cor Astra Otoparts Aspira presisi untuk Mio & Jupiter Z'],

            // --- HANDLE KOPLING (KHUSUS SPORT & MANUAL CLUTCH) ---
            ['AKS-017', 'Handle Tuas Kopling AHM Honda CB150R / CBR150R Original', 42000, 'Aksesoris', 'Handle tuas kopling kiri original Honda AHM (53178-K15-900) untuk CB150R Streetfire & CBR150R'],
            ['AKS-018', 'Handle Tuas Kopling YGP Yamaha Vixion / R15 / MX King Original', 40000, 'Aksesoris', 'Handle tuas kopling kiri original Yamaha YGP (3C1-H3912-00) untuk Vixion, R15, MX King 150'],
            ['AKS-019', 'Handle Tuas Kopling Astra Aspira CB150R / CBR150R', 28000, 'Aksesoris', 'Handle tuas kopling kiri Astra Otoparts Aspira kuat & presisi untuk Honda CB150R'],
            ['AKS-020', 'Handle Tuas Kopling Astra Aspira Vixion / R15', 28000, 'Aksesoris', 'Handle tuas kopling kiri Astra Otoparts Aspira kuat & presisi untuk Yamaha Vixion'],

            // --- KABEL GAS ---
            ['AKS-021', 'Kabel Gas Throttle Cable AHM Honda Beat ESP / Scoopy Original', 28000, 'Aksesoris', 'Kabel gas throttle cable original Honda AHM (17910-K44-V01) untuk Beat ESP & Scoopy ESP'],
            ['AKS-022', 'Kabel Gas Throttle Cable AHM Honda Supra X 125 FI Original', 26000, 'Aksesoris', 'Kabel gas throttle cable original Honda AHM (17910-KYZ-901) untuk Supra X 125 FI'],
            ['AKS-023', 'Kabel Gas Throttle Cable AHM Honda CB150R StreetFire Original', 35000, 'Aksesoris', 'Kabel gas throttle cable A/B original Honda AHM (17910-K15-901) untuk CB150R'],
            ['AKS-024', 'Kabel Gas Throttle Cable YGP Yamaha Mio M3 125 Original', 32000, 'Aksesoris', 'Kabel gas throttle cable original Yamaha YGP (2PH-F6301-00) untuk Mio M3 125 & Fino 125'],
            ['AKS-025', 'Kabel Gas Throttle Cable YGP Yamaha Jupiter Z1 Original', 28000, 'Aksesoris', 'Kabel gas throttle cable original Yamaha YGP (1DY-F6301-00) untuk Jupiter Z1 & Vega Force'],
            ['AKS-026', 'Kabel Gas Throttle Cable YGP Yamaha Vixion Original', 35000, 'Aksesoris', 'Kabel gas throttle cable original Yamaha YGP (3C1-F6301-00) untuk Yamaha Vixion'],
            ['AKS-027', 'Kabel Gas Throttle Cable Astra Aspira Beat ESP', 22000, 'Aksesoris', 'Kabel gas kawat baja lapis teflon Astra Otoparts Aspira tarikan enteng untuk Beat ESP'],
            ['AKS-028', 'Kabel Gas Throttle Cable Astra Aspira Supra X 125', 20000, 'Aksesoris', 'Kabel gas kawat baja lapis teflon Astra Otoparts Aspira tarikan enteng untuk Supra X 125'],
            ['AKS-029', 'Kabel Gas Throttle Cable Astra Aspira Mio M3 / Jupiter Z', 20000, 'Aksesoris', 'Kabel gas kawat baja lapis teflon Astra Otoparts Aspira tarikan enteng untuk Mio M3 & Jupiter Z'],

            // =========================================================================
            // ================= 9. LAIN-LAIN ==========================================
            // =========================================================================
            // --- BAUT & MUR ---
            ['BAU-001', 'Baut Oli Pembuangan Mesin + Ring Washer AHM Honda Original', 12000, 'Aksesoris', 'Baut pembuangan oli mesin tap oli + ring washer aluminium original Honda AHM untuk motor Honda'],
            ['BAU-002', 'Baut Oli Pembuangan Mesin + Ring Washer YGP Yamaha Original', 10000, 'Aksesoris', 'Baut pembuangan oli mesin tap oli + ring washer original Yamaha YGP untuk motor Yamaha'],
            ['BAU-003', 'Baut Mur & Klip Bodi Motor Set Astra Aspira (Isi 10 Pcs)', 15000, 'Aksesoris', 'Paket baut klip bodi kancingan cover motor Astra Otoparts Aspira isi 10 pcs untuk semua motor'],

            // --- LAIN-LAIN (KUNCI KONTAK & STANDAR) ---
            ['AKS-030', 'Kunci Kontak Set Utama + Jok AHM Honda Beat ESP Original', 245000, 'Aksesoris', 'Kunci kontak kontak utama + kunci bagasi jok set original Honda AHM (35010-K81-N00) untuk Beat ESP'],
            ['AKS-031', 'Kunci Kontak Set Utama + Jok AHM Honda Supra X 125 Original', 225000, 'Aksesoris', 'Kunci kontak kontak utama + kunci bagasi jok set original Honda AHM (35010-KPH-880) untuk Supra X 125'],
            ['AKS-032', 'Kunci Kontak Set Utama + Jok YGP Yamaha Mio M3 125 Original', 235000, 'Aksesoris', 'Kunci kontak kontak utama + kunci bagasi jok set original Yamaha YGP (2PH-XH252-00) untuk Mio M3 125'],
            ['AKS-033', 'Kunci Kontak Set Utama + Jok YGP Yamaha Jupiter Z1 Original', 215000, 'Aksesoris', 'Kunci kontak kontak utama + kunci bagasi jok set original Yamaha YGP (1DY-XH252-00) untuk Jupiter Z1'],
            ['AKS-034', 'Standar Samping AHM Honda Beat / Scoopy Original', 45000, 'Aksesoris', 'Side stand / standar samping original Honda AHM (50530-K81-N00) untuk Beat & Scoopy'],
            ['AKS-035', 'Standar Samping AHM Honda Supra X 125 Original', 45000, 'Aksesoris', 'Side stand / standar samping original Honda AHM (50530-KPH-880) untuk Supra X 125 & Revo'],
            ['AKS-036', 'Standar Samping YGP Yamaha Mio / Fino Original', 42000, 'Aksesoris', 'Side stand / standar samping original Yamaha YGP (54P-F7311-00) untuk Mio & Fino'],
            ['AKS-037', 'Standar Samping YGP Yamaha Jupiter Z1 / Vega Original', 40000, 'Aksesoris', 'Side stand / standar samping original Yamaha YGP (5TP-F7311-00) untuk Jupiter Z1 & Vega'],
            ['AKS-038', 'Gantungan Barang Hook Bodi Astra Aspira Universal', 18000, 'Aksesoris', 'Gantungan barang serbaguna dek tengah bodi Astra Otoparts Aspira kokoh untuk semua motor matic & bebek'],
        ];

        foreach ($products as $product) {
            $category = Category::where('name', $product[3])->first();
            $existing = Product::where('sku', $product[0])->first();

            Product::updateOrCreate(
                ['sku' => $product[0]],
                [
                    'category_id' => $category?->id,
                    'name' => $product[1],
                    'price' => $product[2],
                    'description' => $product[4],
                    'stock' => $existing ? $existing->stock : 50,
                    'minimum_stock' => 10,
                    'unit' => 'pcs',
                    'is_available' => true,
                ]
            );
        }
    }
}
