<?php

declare(strict_types=1);

namespace App\Models;

use App\Models\Concerns\BelongsToBusiness;
use App\Services\MotorcyclePartClassifier;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MotorcyclePart extends Model
{
    use BelongsToBusiness;
    use HasFactory, HasUuids;

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
        $labels = [];
        foreach (self::categoryGroups() as $group) {
            $labels += $group['items'];
        }

        return $labels;
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
                    'oli_mesin' => 'Oli Mesin',
                    'oli_gardan' => 'Oli Gardan / Gear Oil',
                    'minyak_rem' => 'Minyak Rem',
                    'coolant' => 'Air Radiator / Coolant',
                ],
            ],
            'kaki_kaki_roda' => [
                'name' => 'Kaki-kaki & Roda',
                'items' => [
                    'ban_depan' => 'Ban Luar Depan',
                    'ban_belakang' => 'Ban Luar Belakang',
                    'ban_dalam_depan' => 'Ban Dalam Depan',
                    'ban_dalam_belakang' => 'Ban Dalam Belakang',
                    'bearing_roda' => 'Bearing / Laher Roda',
                    'velg' => 'Velg',
                    'shockbreaker_depan' => 'Shockbreaker Depan',
                    'shockbreaker_belakang' => 'Shockbreaker Belakang',
                    'seal_shock' => 'Seal Shockbreaker',
                ],
            ],
            'pengereman' => [
                'name' => 'Pengereman',
                'items' => [
                    'kampas_rem_depan' => 'Kampas Rem Depan / Cakram',
                    'kampas_rem_belakang' => 'Kampas Rem Belakang / Tromol',
                    'piringan_cakram' => 'Piringan Cakram',
                    'master_rem' => 'Master Rem',
                    'kabel_rem' => 'Kabel Rem',
                ],
            ],
            'transmisi_penggerak' => [
                'name' => 'Penggerak & Transmisi',
                'items' => [
                    'v_belt' => 'V-Belt (CVT)',
                    'roller' => 'Roller (CVT)',
                    'per_cvt' => 'Per CVT',
                    'kampas_ganda' => 'Kampas Ganda (CVT)',
                    'gear_set' => 'Gear Set & Rantai',
                    'rantai' => 'Rantai Saja',
                    'kampas_kopling' => 'Kampas Kopling',
                    'kabel_kopling' => 'Kabel Kopling',
                ],
            ],
            'kelistrikan_pengapian' => [
                'name' => 'Kelistrikan & Pengapian',
                'items' => [
                    'aki' => 'Aki / Battery',
                    'busi' => 'Busi',
                    'kiprok' => 'Kiprok / Regulator',
                    'cdi_ecu' => 'CDI / ECU',
                    'koil' => 'Koil Pengapian',
                    'dinamo_starter' => 'Dinamo Starter',
                    'bendik_starter' => 'Bendik / Relay Starter',
                ],
            ],
            'lampu_saklar' => [
                'name' => 'Lampu & Saklar',
                'items' => [
                    'lampu_depan' => 'Lampu Depan (Headlight)',
                    'lampu_belakang' => 'Lampu Belakang (Taillight)',
                    'lampu_sein' => 'Lampu Sein',
                    'saklar' => 'Saklar / Switch',
                    'klakson' => 'Klakson',
                ],
            ],
            'mesin_filter' => [
                'name' => 'Mesin & Filter',
                'items' => [
                    'filter_udara' => 'Filter Udara',
                    'filter_oli' => 'Filter Oli',
                    'karburator' => 'Karburator / Repair Kit',
                    'injektor' => 'Injektor',
                    'piston_kit' => 'Piston & Ring',
                    'noken_as' => 'Noken As / Camshaft',
                    'klep' => 'Klep / Valve',
                    'rantai_keteng' => 'Rantai Keteng / Cam Chain',
                    'gasket_packing' => 'Gasket / Packing',
                ],
            ],
            'bodi_aksesoris' => [
                'name' => 'Bodi & Aksesoris',
                'items' => [
                    'spion' => 'Spion',
                    'handgrip' => 'Handgrip',
                    'handle_rem' => 'Handle Rem',
                    'handle_kopling' => 'Handle Kopling',
                    'kabel_gas' => 'Kabel Gas',
                ],
            ],
            'lainnya' => [
                'name' => 'Lain-lain',
                'items' => [
                    'baut_mur' => 'Baut & Mur',
                    'lainnya' => 'Lain-lain',
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
        return app(MotorcyclePartClassifier::class)->guess($product);
    }
}
