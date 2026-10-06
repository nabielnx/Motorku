<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Category extends Model
{
    public const CATALOG_GROUPS = [
        'automotive' => 'Otomotif',
        'electronics' => 'Elektronik',
        'hardware' => 'Alat Bangunan',
        'bicycle' => 'Sepeda',
    ];

    use HasFactory, HasUuids;

    protected $attributes = ['catalog_group' => 'automotive'];

    protected $fillable = [
        'catalog_group',
        'name',
        'parent_id',
        'description',
        'sync_version',
    ];

    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(Category::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(Category::class, 'parent_id');
    }
}
