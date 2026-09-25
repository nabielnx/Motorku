<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class MotorcyclePart extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $fillable = [
        'motorcycle_id',
        'product_id',
        'part_category',
        'notes',
        'is_recommended',
    ];

    protected $casts = [
        'is_recommended' => 'boolean',
    ];

    public function motorcycle(): BelongsTo
    {
        return $this->belongsTo(Motorcycle::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * Human-readable part category labels.
     */
    public static function categoryLabels(): array
    {
        return [
            // Pelumas & Cairan
            'oli_mesin'            => 'Oli Mesin',
            'oli_gardan'           => 'Oli Gardan / Gear Oil',
            'minyak_rem'           => 'Minyak Rem',
            'coolant'              => 'Air Radiator / Coolant',
            
            // Kaki-kaki & Roda
            'ban_depan'            => 'Ban Luar Depan',
            'ban_belakang'         => 'Ban Luar Belakang',
            'ban_dalam_depan'      => 'Ban Dalam Depan',
            'ban_dalam_belakang'   => 'Ban Dalam Belakang',
            'bearing_roda'         => 'Bearing / Laher Roda',
            'velg'                 => 'Velg',
            'shockbreaker_depan'   => 'Shockbreaker Depan',
            'shockbreaker_belakang'=> 'Shockbreaker Belakang',
            'seal_shock'           => 'Seal Shockbreaker',
            
            // Pengereman
            'kampas_rem_depan'     => 'Kampas Rem Depan / Cakram',
            'kampas_rem_belakang'  => 'Kampas Rem Belakang / Tromol',
            'piringan_cakram'      => 'Piringan Cakram',
            'master_rem'           => 'Master Rem',
            'kabel_rem'            => 'Kabel Rem',
            
            // Penggerak & Transmisi (CVT/Rantai)
            'v_belt'               => 'V-Belt (CVT)',
            'roller'               => 'Roller (CVT)',
            'per_cvt'              => 'Per CVT',
            'kampas_ganda'         => 'Kampas Ganda (CVT)',
            'gear_set'             => 'Gear Set & Rantai',
            'rantai'               => 'Rantai Saja',
            'kampas_kopling'       => 'Kampas Kopling',
            'kabel_kopling'        => 'Kabel Kopling',
            
            // Kelistrikan & Pengapian
            'aki'                  => 'Aki / Battery',
            'busi'                 => 'Busi',
            'kiprok'               => 'Kiprok / Regulator',
            'cdi_ecu'              => 'CDI / ECU',
            'koil'                 => 'Koil Pengapian',
            'dinamo_starter'       => 'Dinamo Starter',
            'bendik_starter'       => 'Bendik / Relay Starter',
            
            // Lampu & Saklar
            'lampu_depan'          => 'Lampu Depan (Headlight)',
            'lampu_belakang'       => 'Lampu Belakang (Taillight)',
            'lampu_sein'           => 'Lampu Sein',
            'saklar'               => 'Saklar / Switch',
            'klakson'              => 'Klakson',
            
            // Mesin & Filter
            'filter_udara'         => 'Filter Udara',
            'filter_oli'           => 'Filter Oli',
            'karburator'           => 'Karburator / Repair Kit',
            'injektor'             => 'Injektor',
            'piston_kit'           => 'Piston & Ring',
            'noken_as'             => 'Noken As / Camshaft',
            'klep'                 => 'Klep / Valve',
            'rantai_keteng'        => 'Rantai Keteng / Cam Chain',
            'gasket_packing'       => 'Gasket / Packing',
            
            // Bodi & Aksesoris
            'spion'                => 'Spion',
            'handgrip'             => 'Handgrip',
            'handle_rem'           => 'Handle Rem',
            'handle_kopling'       => 'Handle Kopling',
            'kabel_gas'            => 'Kabel Gas',
            
            // Lain-lain
            'baut_mur'             => 'Baut & Mur',
            'lainnya'              => 'Lain-lain',
        ];
    }

    /**
     * Grouped part categories for structured UI filters and optgroups.
     */
    public static function categoryGroups(): array
    {
        return [
            'pelumas_cairan' => [
                'name' => 'Pelumas & Cairan',
                'items' => [
                    'oli_mesin'  => 'Oli Mesin',
                    'oli_gardan' => 'Oli Gardan / Gear Oil',
                    'minyak_rem' => 'Minyak Rem',
                    'coolant'    => 'Air Radiator / Coolant',
                ],
            ],
            'kaki_kaki_roda' => [
                'name' => 'Kaki-kaki & Roda',
                'items' => [
                    'ban_depan'            => 'Ban Luar Depan',
                    'ban_belakang'         => 'Ban Luar Belakang',
                    'ban_dalam_depan'      => 'Ban Dalam Depan',
                    'ban_dalam_belakang'   => 'Ban Dalam Belakang',
                    'bearing_roda'         => 'Bearing / Laher Roda',
                    'velg'                 => 'Velg',
                    'shockbreaker_depan'   => 'Shockbreaker Depan',
                    'shockbreaker_belakang'=> 'Shockbreaker Belakang',
                    'seal_shock'           => 'Seal Shockbreaker',
                ],
            ],
            'pengereman' => [
                'name' => 'Pengereman',
                'items' => [
                    'kampas_rem_depan'    => 'Kampas Rem Depan / Cakram',
                    'kampas_rem_belakang' => 'Kampas Rem Belakang / Tromol',
                    'piringan_cakram'     => 'Piringan Cakram',
                    'master_rem'          => 'Master Rem',
                    'kabel_rem'           => 'Kabel Rem',
                ],
            ],
            'transmisi_penggerak' => [
                'name' => 'Penggerak & Transmisi',
                'items' => [
                    'v_belt'         => 'V-Belt (CVT)',
                    'roller'         => 'Roller (CVT)',
                    'per_cvt'        => 'Per CVT',
                    'kampas_ganda'   => 'Kampas Ganda (CVT)',
                    'gear_set'       => 'Gear Set & Rantai',
                    'rantai'         => 'Rantai Saja',
                    'kampas_kopling' => 'Kampas Kopling',
                    'kabel_kopling'  => 'Kabel Kopling',
                ],
            ],
            'kelistrikan_pengapian' => [
                'name' => 'Kelistrikan & Pengapian',
                'items' => [
                    'aki'            => 'Aki / Battery',
                    'busi'           => 'Busi',
                    'kiprok'         => 'Kiprok / Regulator',
                    'cdi_ecu'        => 'CDI / ECU',
                    'koil'           => 'Koil Pengapian',
                    'dinamo_starter' => 'Dinamo Starter',
                    'bendik_starter' => 'Bendik / Relay Starter',
                ],
            ],
            'lampu_saklar' => [
                'name' => 'Lampu & Saklar',
                'items' => [
                    'lampu_depan'    => 'Lampu Depan (Headlight)',
                    'lampu_belakang' => 'Lampu Belakang (Taillight)',
                    'lampu_sein'     => 'Lampu Sein',
                    'saklar'         => 'Saklar / Switch',
                    'klakson'        => 'Klakson',
                ],
            ],
            'mesin_filter' => [
                'name' => 'Mesin & Filter',
                'items' => [
                    'filter_udara'   => 'Filter Udara',
                    'filter_oli'     => 'Filter Oli',
                    'karburator'     => 'Karburator / Repair Kit',
                    'injektor'       => 'Injektor',
                    'piston_kit'     => 'Piston & Ring',
                    'noken_as'       => 'Noken As / Camshaft',
                    'klep'           => 'Klep / Valve',
                    'rantai_keteng'  => 'Rantai Keteng / Cam Chain',
                    'gasket_packing' => 'Gasket / Packing',
                ],
            ],
            'bodi_aksesoris' => [
                'name' => 'Bodi & Aksesoris',
                'items' => [
                    'spion'          => 'Spion',
                    'handgrip'       => 'Handgrip',
                    'handle_rem'     => 'Handle Rem',
                    'handle_kopling' => 'Handle Kopling',
                    'kabel_gas'      => 'Kabel Gas',
                ],
            ],
            'lainnya' => [
                'name' => 'Lain-lain',
                'items' => [
                    'baut_mur' => 'Baut & Mur',
                    'lainnya'  => 'Lain-lain',
                ],
            ],
        ];
    }

    /**
     * Find group key for a given category key.
     */
    public static function getGroupKeyForCategory(string $category): string
    {
        foreach (self::categoryGroups() as $groupKey => $group) {
            if (isset($group['items'][$category])) {
                return $groupKey;
            }
        }
        return 'lainnya';
    }

    /**
     * Find group name for a given category key.
     */
    public static function getGroupNameForCategory(string $category): string
    {
        $groupKey = self::getGroupKeyForCategory($category);
        return self::categoryGroups()[$groupKey]['name'] ?? 'Lain-lain';
    }

    /**
     * Intelligently guess part_category based on product name and catalog category.
     */
    public static function guessCategoryForProduct(Product $product): string
    {
        $name = strtolower($product->name ?? '');
        $catName = strtolower($product->category?->name ?? '');

        // 1. Pelumas & Cairan
        if (str_contains($name, 'gardan') || str_contains($name, 'gear oil') || str_contains($name, 'oli gear')) {
            return 'oli_gardan';
        }
        if (str_contains($name, 'minyak rem') || str_contains($name, 'brake fluid')) {
            return 'minyak_rem';
        }
        if (str_contains($name, 'coolant') || str_contains($name, 'radiator')) {
            return 'coolant';
        }
        if ((str_contains($name, 'oli') && !str_contains($name, 'filter')) || str_contains($catName, 'oli') || str_contains($catName, 'pelumas')) {
            return 'oli_mesin';
        }

        // 2. Pengereman
        if (str_contains($name, 'kampas rem depan') || str_contains($name, 'dispad') || str_contains($name, 'disc pad') || str_contains($name, 'brake pad')) {
            return 'kampas_rem_depan';
        }
        if (str_contains($name, 'kampas rem belakang') || str_contains($name, 'tromol') || str_contains($name, 'brake shoe')) {
            return 'kampas_rem_belakang';
        }
        if (str_contains($name, 'kampas rem')) {
            return 'kampas_rem_depan';
        }
        if (str_contains($name, 'piringan') || str_contains($name, 'cakram') || str_contains($name, 'disc brake') || str_contains($name, 'rotor')) {
            return 'piringan_cakram';
        }
        if (str_contains($name, 'master rem')) {
            return 'master_rem';
        }
        if (str_contains($name, 'kabel rem') || str_contains($name, 'selang rem')) {
            return 'kabel_rem';
        }

        // 3. Kaki-kaki & Roda
        if (str_contains($name, 'ban dalam')) {
            return str_contains($name, 'belakang') ? 'ban_dalam_belakang' : 'ban_dalam_depan';
        }
        if (str_contains($name, 'ban') || str_contains($catName, 'ban')) {
            return str_contains($name, 'belakang') ? 'ban_belakang' : 'ban_depan';
        }
        if (str_contains($name, 'bearing') || str_contains($name, 'laher')) {
            return 'bearing_roda';
        }
        if (str_contains($name, 'velg') || str_contains($name, 'pelek') || str_contains($name, 'rim')) {
            return 'velg';
        }
        if (str_contains($name, 'seal shock')) {
            return 'seal_shock';
        }
        if (str_contains($name, 'shock') || str_contains($name, 'suspensi')) {
            return str_contains($name, 'depan') ? 'shockbreaker_depan' : 'shockbreaker_belakang';
        }

        // 4. Penggerak & Transmisi
        if (str_contains($name, 'v-belt') || str_contains($name, 'vbelt') || str_contains($name, 'vanbelt') || str_contains($name, 'tali kipas')) {
            return 'v_belt';
        }
        if (str_contains($name, 'roller')) {
            return 'roller';
        }
        if (str_contains($name, 'per cvt')) {
            return 'per_cvt';
        }
        if (str_contains($name, 'kampas ganda')) {
            return 'kampas_ganda';
        }
        if (str_contains($name, 'gear set') || str_contains($name, 'gir set')) {
            return 'gear_set';
        }
        if (str_contains($name, 'rantai') && !str_contains($name, 'keteng')) {
            return 'rantai';
        }
        if (str_contains($name, 'kampas kopling')) {
            return 'kampas_kopling';
        }
        if (str_contains($name, 'kabel kopling')) {
            return 'kabel_kopling';
        }

        // 5. Kelistrikan & Pengapian
        if (str_contains($name, 'aki') || str_contains($name, 'accu') || str_contains($name, 'battery')) {
            return 'aki';
        }
        if (str_contains($name, 'busi') || str_contains($name, 'spark plug')) {
            return 'busi';
        }
        if (str_contains($name, 'kiprok') || str_contains($name, 'regulator')) {
            return 'kiprok';
        }
        if (str_contains($name, 'cdi') || str_contains($name, 'ecu')) {
            return 'cdi_ecu';
        }
        if (str_contains($name, 'koil') || str_contains($name, 'coil')) {
            return 'koil';
        }
        if (str_contains($name, 'bendik') || str_contains($name, 'relay starter')) {
            return 'bendik_starter';
        }
        if (str_contains($name, 'starter') || str_contains($name, 'dinamo')) {
            return 'dinamo_starter';
        }

        // 6. Lampu & Saklar
        if (str_contains($name, 'sein') || str_contains($name, 'sign')) {
            return 'lampu_sein';
        }
        if (str_contains($name, 'lampu belakang') || str_contains($name, 'stop lamp')) {
            return 'lampu_belakang';
        }
        if (str_contains($name, 'lampu') || str_contains($name, 'bohlam') || str_contains($name, 'led')) {
            return 'lampu_depan';
        }
        if (str_contains($name, 'saklar') || str_contains($name, 'switch')) {
            return 'saklar';
        }
        if (str_contains($name, 'klakson') || str_contains($name, 'horn')) {
            return 'klakson';
        }

        // 7. Mesin & Filter
        if (str_contains($name, 'filter udara') || str_contains($name, 'saringan udara') || str_contains($name, 'air filter')) {
            return 'filter_udara';
        }
        if (str_contains($name, 'filter oli')) {
            return 'filter_oli';
        }
        if (str_contains($name, 'karburator')) {
            return 'karburator';
        }
        if (str_contains($name, 'injektor') || str_contains($name, 'injector')) {
            return 'injektor';
        }
        if (str_contains($name, 'piston') || str_contains($name, 'ring seher')) {
            return 'piston_kit';
        }
        if (str_contains($name, 'noken as') || str_contains($name, 'camshaft')) {
            return 'noken_as';
        }
        if (str_contains($name, 'klep') || str_contains($name, 'valve')) {
            return 'klep';
        }
        if (str_contains($name, 'rantai keteng') || str_contains($name, 'kamrat')) {
            return 'rantai_keteng';
        }
        if (str_contains($name, 'gasket') || str_contains($name, 'packing')) {
            return 'gasket_packing';
        }

        // 8. Bodi & Aksesoris
        if (str_contains($name, 'spion')) {
            return 'spion';
        }
        if (str_contains($name, 'handgrip') || str_contains($name, 'grip')) {
            return 'handgrip';
        }
        if (str_contains($name, 'handle rem') || str_contains($name, 'handle')) {
            return 'handle_rem';
        }
        if (str_contains($name, 'kabel gas')) {
            return 'kabel_gas';
        }
        if (str_contains($name, 'baut') || str_contains($name, 'mur') || str_contains($name, 'bolt') || str_contains($name, 'nut')) {
            return 'baut_mur';
        }

        return 'lainnya';
    }
}
