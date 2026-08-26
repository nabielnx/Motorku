<?php

namespace Database\Seeders;

use App\Models\Motorcycle;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class MotorcycleSeeder extends Seeder
{
    public function run(): void
    {
        $motorcycles = [
            // ==========================================================
            // ================= HONDA (Dominasi ~80% pasar) ============
            // ==========================================================

            // --- Honda Matic ---
            ['brand' => 'Honda', 'model' => 'Beat Karbu', 'year_start' => 2008, 'year_end' => 2012, 'engine_cc' => 110, 'engine_type' => 'matic'],
            ['brand' => 'Honda', 'model' => 'Beat FI', 'year_start' => 2012, 'year_end' => 2014, 'engine_cc' => 110, 'engine_type' => 'matic'],
            ['brand' => 'Honda', 'model' => 'Beat ESP', 'year_start' => 2015, 'year_end' => 2019, 'engine_cc' => 110, 'engine_type' => 'matic'],
            ['brand' => 'Honda', 'model' => 'Beat Deluxe/Street', 'year_start' => 2020, 'year_end' => null, 'engine_cc' => 110, 'engine_type' => 'matic'],
            ['brand' => 'Honda', 'model' => 'Beat Street CBS', 'year_start' => 2017, 'year_end' => null, 'engine_cc' => 110, 'engine_type' => 'matic'],
            ['brand' => 'Honda', 'model' => 'Vario 110 FI', 'year_start' => 2014, 'year_end' => 2019, 'engine_cc' => 110, 'engine_type' => 'matic'],
            ['brand' => 'Honda', 'model' => 'Vario 125 (Old)', 'year_start' => 2012, 'year_end' => 2017, 'engine_cc' => 125, 'engine_type' => 'matic'],
            ['brand' => 'Honda', 'model' => 'Vario 125', 'year_start' => 2018, 'year_end' => null, 'engine_cc' => 125, 'engine_type' => 'matic'],
            ['brand' => 'Honda', 'model' => 'Vario 150', 'year_start' => 2015, 'year_end' => 2022, 'engine_cc' => 150, 'engine_type' => 'matic'],
            ['brand' => 'Honda', 'model' => 'Vario 160', 'year_start' => 2022, 'year_end' => null, 'engine_cc' => 160, 'engine_type' => 'matic'],
            ['brand' => 'Honda', 'model' => 'Scoopy FI', 'year_start' => 2013, 'year_end' => null, 'engine_cc' => 110, 'engine_type' => 'matic'],
            ['brand' => 'Honda', 'model' => 'Genio', 'year_start' => 2019, 'year_end' => null, 'engine_cc' => 110, 'engine_type' => 'matic'],
            ['brand' => 'Honda', 'model' => 'Spacy', 'year_start' => 2011, 'year_end' => 2018, 'engine_cc' => 110, 'engine_type' => 'matic'],
            ['brand' => 'Honda', 'model' => 'PCX 150', 'year_start' => 2018, 'year_end' => 2021, 'engine_cc' => 150, 'engine_type' => 'matic'],
            ['brand' => 'Honda', 'model' => 'PCX 160', 'year_start' => 2021, 'year_end' => null, 'engine_cc' => 160, 'engine_type' => 'matic'],
            ['brand' => 'Honda', 'model' => 'ADV 150', 'year_start' => 2019, 'year_end' => 2022, 'engine_cc' => 150, 'engine_type' => 'matic'],
            ['brand' => 'Honda', 'model' => 'ADV 160', 'year_start' => 2022, 'year_end' => null, 'engine_cc' => 160, 'engine_type' => 'matic'],
            ['brand' => 'Honda', 'model' => 'Stylo 160', 'year_start' => 2024, 'year_end' => null, 'engine_cc' => 160, 'engine_type' => 'matic'],

            // --- Honda Bebek ---
            ['brand' => 'Honda', 'model' => 'Supra X 125 FI', 'year_start' => 2014, 'year_end' => null, 'engine_cc' => 125, 'engine_type' => 'bebek'],
            ['brand' => 'Honda', 'model' => 'Supra GTR 150', 'year_start' => 2016, 'year_end' => null, 'engine_cc' => 150, 'engine_type' => 'bebek'],
            ['brand' => 'Honda', 'model' => 'Revo X / FI', 'year_start' => 2014, 'year_end' => null, 'engine_cc' => 110, 'engine_type' => 'bebek'],
            ['brand' => 'Honda', 'model' => 'Blade 125 FI', 'year_start' => 2014, 'year_end' => 2019, 'engine_cc' => 125, 'engine_type' => 'bebek'],

            // --- Honda Sport ---
            ['brand' => 'Honda', 'model' => 'CB150R StreetFire', 'year_start' => 2015, 'year_end' => null, 'engine_cc' => 150, 'engine_type' => 'sport'],
            ['brand' => 'Honda', 'model' => 'CB150X', 'year_start' => 2021, 'year_end' => null, 'engine_cc' => 150, 'engine_type' => 'sport'],
            ['brand' => 'Honda', 'model' => 'CBR150R K45', 'year_start' => 2016, 'year_end' => null, 'engine_cc' => 150, 'engine_type' => 'sport'],
            ['brand' => 'Honda', 'model' => 'CBR250RR', 'year_start' => 2016, 'year_end' => null, 'engine_cc' => 250, 'engine_type' => 'sport'],
            ['brand' => 'Honda', 'model' => 'CRF150L', 'year_start' => 2017, 'year_end' => null, 'engine_cc' => 150, 'engine_type' => 'sport'],
            ['brand' => 'Honda', 'model' => 'CRF250Rally', 'year_start' => 2018, 'year_end' => null, 'engine_cc' => 250, 'engine_type' => 'sport'],
            ['brand' => 'Honda', 'model' => 'Sonic 150R', 'year_start' => 2015, 'year_end' => null, 'engine_cc' => 150, 'engine_type' => 'sport'],
            ['brand' => 'Honda', 'model' => 'Megapro FI', 'year_start' => 2014, 'year_end' => 2018, 'engine_cc' => 150, 'engine_type' => 'sport'],

            // ==========================================================
            // ================= YAMAHA (Market Share ~20%) ==============
            // ==========================================================

            // --- Yamaha Matic ---
            ['brand' => 'Yamaha', 'model' => 'NMAX (Old)', 'year_start' => 2015, 'year_end' => 2019, 'engine_cc' => 155, 'engine_type' => 'matic'],
            ['brand' => 'Yamaha', 'model' => 'NMAX 155 Connected', 'year_start' => 2020, 'year_end' => null, 'engine_cc' => 155, 'engine_type' => 'matic'],
            ['brand' => 'Yamaha', 'model' => 'NMAX Turbo', 'year_start' => 2024, 'year_end' => null, 'engine_cc' => 155, 'engine_type' => 'matic'],
            ['brand' => 'Yamaha', 'model' => 'Aerox 155 (Old)', 'year_start' => 2017, 'year_end' => 2020, 'engine_cc' => 155, 'engine_type' => 'matic'],
            ['brand' => 'Yamaha', 'model' => 'Aerox 155 Connected', 'year_start' => 2021, 'year_end' => null, 'engine_cc' => 155, 'engine_type' => 'matic'],
            ['brand' => 'Yamaha', 'model' => 'Lexi 125', 'year_start' => 2018, 'year_end' => 2024, 'engine_cc' => 125, 'engine_type' => 'matic'],
            ['brand' => 'Yamaha', 'model' => 'Lexi LX 155', 'year_start' => 2024, 'year_end' => null, 'engine_cc' => 155, 'engine_type' => 'matic'],
            ['brand' => 'Yamaha', 'model' => 'Fazzio', 'year_start' => 2022, 'year_end' => null, 'engine_cc' => 125, 'engine_type' => 'matic'],
            ['brand' => 'Yamaha', 'model' => 'Fazzio Neo', 'year_start' => 2024, 'year_end' => null, 'engine_cc' => 125, 'engine_type' => 'matic'],
            ['brand' => 'Yamaha', 'model' => 'Grand Filano', 'year_start' => 2023, 'year_end' => null, 'engine_cc' => 125, 'engine_type' => 'matic'],
            ['brand' => 'Yamaha', 'model' => 'Mio Sporty/Smile', 'year_start' => 2008, 'year_end' => 2013, 'engine_cc' => 115, 'engine_type' => 'matic'],
            ['brand' => 'Yamaha', 'model' => 'Mio J', 'year_start' => 2012, 'year_end' => 2015, 'engine_cc' => 115, 'engine_type' => 'matic'],
            ['brand' => 'Yamaha', 'model' => 'Mio M3 125', 'year_start' => 2014, 'year_end' => null, 'engine_cc' => 125, 'engine_type' => 'matic'],
            ['brand' => 'Yamaha', 'model' => 'Fino 125', 'year_start' => 2016, 'year_end' => null, 'engine_cc' => 125, 'engine_type' => 'matic'],
            ['brand' => 'Yamaha', 'model' => 'FreeGo 125', 'year_start' => 2018, 'year_end' => null, 'engine_cc' => 125, 'engine_type' => 'matic'],
            ['brand' => 'Yamaha', 'model' => 'XMAX 250', 'year_start' => 2017, 'year_end' => null, 'engine_cc' => 250, 'engine_type' => 'matic'],
            ['brand' => 'Yamaha', 'model' => 'TMAX 560', 'year_start' => 2020, 'year_end' => null, 'engine_cc' => 560, 'engine_type' => 'matic'],

            // --- Yamaha Bebek ---
            ['brand' => 'Yamaha', 'model' => 'Jupiter MX 135', 'year_start' => 2005, 'year_end' => 2015, 'engine_cc' => 135, 'engine_type' => 'bebek'],
            ['brand' => 'Yamaha', 'model' => 'MX King 150', 'year_start' => 2015, 'year_end' => null, 'engine_cc' => 150, 'engine_type' => 'bebek'],
            ['brand' => 'Yamaha', 'model' => 'Jupiter Z1', 'year_start' => 2012, 'year_end' => null, 'engine_cc' => 115, 'engine_type' => 'bebek'],
            ['brand' => 'Yamaha', 'model' => 'Vega Force', 'year_start' => 2015, 'year_end' => null, 'engine_cc' => 115, 'engine_type' => 'bebek'],

            // --- Yamaha Sport ---
            ['brand' => 'Yamaha', 'model' => 'Vixion (Old)', 'year_start' => 2007, 'year_end' => 2016, 'engine_cc' => 150, 'engine_type' => 'sport'],
            ['brand' => 'Yamaha', 'model' => 'Vixion / Vixion R', 'year_start' => 2017, 'year_end' => null, 'engine_cc' => 155, 'engine_type' => 'sport'],
            ['brand' => 'Yamaha', 'model' => 'R15 V3 / R15M', 'year_start' => 2017, 'year_end' => null, 'engine_cc' => 155, 'engine_type' => 'sport'],
            ['brand' => 'Yamaha', 'model' => 'R25', 'year_start' => 2014, 'year_end' => null, 'engine_cc' => 250, 'engine_type' => 'sport'],
            ['brand' => 'Yamaha', 'model' => 'MT-15', 'year_start' => 2019, 'year_end' => null, 'engine_cc' => 155, 'engine_type' => 'sport'],
            ['brand' => 'Yamaha', 'model' => 'MT-25', 'year_start' => 2015, 'year_end' => null, 'engine_cc' => 250, 'engine_type' => 'sport'],
            ['brand' => 'Yamaha', 'model' => 'XSR 155', 'year_start' => 2019, 'year_end' => null, 'engine_cc' => 155, 'engine_type' => 'sport'],
            ['brand' => 'Yamaha', 'model' => 'Byson FI', 'year_start' => 2012, 'year_end' => 2020, 'engine_cc' => 150, 'engine_type' => 'sport'],
            ['brand' => 'Yamaha', 'model' => 'WR155R', 'year_start' => 2019, 'year_end' => null, 'engine_cc' => 155, 'engine_type' => 'sport'],

            // ==========================================================
            // ================= SUZUKI =================================
            // ==========================================================

            // --- Suzuki Matic ---
            ['brand' => 'Suzuki', 'model' => 'Nex II', 'year_start' => 2018, 'year_end' => null, 'engine_cc' => 115, 'engine_type' => 'matic'],
            ['brand' => 'Suzuki', 'model' => 'Address FI', 'year_start' => 2014, 'year_end' => null, 'engine_cc' => 115, 'engine_type' => 'matic'],
            ['brand' => 'Suzuki', 'model' => 'Avenis 125', 'year_start' => 2022, 'year_end' => null, 'engine_cc' => 125, 'engine_type' => 'matic'],
            ['brand' => 'Suzuki', 'model' => 'Burgman Street 125', 'year_start' => 2020, 'year_end' => null, 'engine_cc' => 125, 'engine_type' => 'matic'],
            ['brand' => 'Suzuki', 'model' => 'Spin 125', 'year_start' => 2006, 'year_end' => 2011, 'engine_cc' => 125, 'engine_type' => 'matic'],
            ['brand' => 'Suzuki', 'model' => 'Skywave / Skydrive', 'year_start' => 2007, 'year_end' => 2014, 'engine_cc' => 125, 'engine_type' => 'matic'],

            // --- Suzuki Bebek ---
            ['brand' => 'Suzuki', 'model' => 'Smash / Smash FI', 'year_start' => 2003, 'year_end' => null, 'engine_cc' => 115, 'engine_type' => 'bebek'],
            ['brand' => 'Suzuki', 'model' => 'Shogun 125', 'year_start' => 2004, 'year_end' => 2014, 'engine_cc' => 125, 'engine_type' => 'bebek'],

            // --- Suzuki Sport ---
            ['brand' => 'Suzuki', 'model' => 'Satria F150 FI', 'year_start' => 2016, 'year_end' => null, 'engine_cc' => 150, 'engine_type' => 'sport'],
            ['brand' => 'Suzuki', 'model' => 'Satria FU (Karbu)', 'year_start' => 2004, 'year_end' => 2015, 'engine_cc' => 150, 'engine_type' => 'sport'],
            ['brand' => 'Suzuki', 'model' => 'GSX-R150', 'year_start' => 2017, 'year_end' => null, 'engine_cc' => 150, 'engine_type' => 'sport'],
            ['brand' => 'Suzuki', 'model' => 'GSX-S150', 'year_start' => 2017, 'year_end' => null, 'engine_cc' => 150, 'engine_type' => 'sport'],
            ['brand' => 'Suzuki', 'model' => 'Thunder 125', 'year_start' => 2004, 'year_end' => 2015, 'engine_cc' => 125, 'engine_type' => 'sport'],

            // ==========================================================
            // ================= KAWASAKI ===============================
            // ==========================================================

            // --- Kawasaki Sport / Trail ---
            ['brand' => 'Kawasaki', 'model' => 'Ninja 250 FI', 'year_start' => 2018, 'year_end' => null, 'engine_cc' => 250, 'engine_type' => 'sport'],
            ['brand' => 'Kawasaki', 'model' => 'Ninja 250R (Old)', 'year_start' => 2008, 'year_end' => 2017, 'engine_cc' => 250, 'engine_type' => 'sport'],
            ['brand' => 'Kawasaki', 'model' => 'Ninja ZX-25R', 'year_start' => 2020, 'year_end' => null, 'engine_cc' => 250, 'engine_type' => 'sport'],
            ['brand' => 'Kawasaki', 'model' => 'Ninja 150 RR (2 Tak)', 'year_start' => 1996, 'year_end' => 2015, 'engine_cc' => 150, 'engine_type' => 'sport'],
            ['brand' => 'Kawasaki', 'model' => 'KLX 150', 'year_start' => 2009, 'year_end' => null, 'engine_cc' => 150, 'engine_type' => 'sport'],
            ['brand' => 'Kawasaki', 'model' => 'KLX 230', 'year_start' => 2019, 'year_end' => null, 'engine_cc' => 230, 'engine_type' => 'sport'],
            ['brand' => 'Kawasaki', 'model' => 'D-Tracker 150', 'year_start' => 2010, 'year_end' => null, 'engine_cc' => 150, 'engine_type' => 'sport'],
            ['brand' => 'Kawasaki', 'model' => 'W175', 'year_start' => 2017, 'year_end' => null, 'engine_cc' => 177, 'engine_type' => 'sport'],

            // --- Kawasaki Bebek ---
            ['brand' => 'Kawasaki', 'model' => 'Athlete', 'year_start' => 2008, 'year_end' => 2015, 'engine_cc' => 125, 'engine_type' => 'bebek'],
            ['brand' => 'Kawasaki', 'model' => 'Kaze R', 'year_start' => 1995, 'year_end' => 2006, 'engine_cc' => 112, 'engine_type' => 'bebek'],

            // ==========================================================
            // ================= TVS ====================================
            // ==========================================================
            ['brand' => 'TVS', 'model' => 'Apache RTR 150', 'year_start' => 2019, 'year_end' => null, 'engine_cc' => 150, 'engine_type' => 'sport'],
            ['brand' => 'TVS', 'model' => 'Apache RTR 200', 'year_start' => 2019, 'year_end' => null, 'engine_cc' => 200, 'engine_type' => 'sport'],
        ];

        foreach ($motorcycles as $data) {
            $slug = Str::slug($data['brand'] . '-' . $data['model'] . '-' . $data['year_start']);

            Motorcycle::firstOrCreate(
                ['slug' => $slug],
                array_merge($data, ['slug' => $slug])
            );
        }
    }
}
