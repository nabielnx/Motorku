<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $fillable = [
        'category_id',
        'sku',
        'name',
        'description',
        'brand',
        'barcode',
        'price',
        'cost_price',
        'stock',
        'minimum_stock',
        'unit',
        'rack_location',
        'image_path',
        'is_available',
        'sync_version'
    ];

    protected $casts = [
        'price'        => 'decimal:2',
        'cost_price'   => 'decimal:2',
        'stock'        => 'integer',
        'minimum_stock'=> 'integer',
        'is_available' => 'boolean',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function motorcycles(): BelongsToMany
    {
        return $this->belongsToMany(Motorcycle::class, 'motorcycle_parts')
            ->withPivot('part_category', 'notes', 'is_recommended')
            ->withTimestamps();
    }

    public function motorcycleParts(): HasMany
    {
        return $this->hasMany(MotorcyclePart::class);
    }

    public function getMarginAttribute()
    {
        if (is_null($this->cost_price)) {
            return 0;
        }
        return max(0, $this->price - $this->cost_price);
    }

    public function getStockStatusLabelAttribute()
    {
        if ($this->stock <= 0) {
            return 'Habis';
        }
        if ($this->stock <= $this->minimum_stock) {
            return 'Perlu Kulak';
        }
        return 'Tersedia';
    }
}
