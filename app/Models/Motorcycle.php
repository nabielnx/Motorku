<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Motorcycle extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'brand',
        'model',
        'slug',
        'year_start',
        'year_end',
        'engine_cc',
        'engine_type',
        'image_url',
    ];

    protected $casts = [
        'year_start' => 'integer',
        'year_end' => 'integer',
        'engine_cc' => 'integer',
    ];

    /**
     * Display name, e.g. "Honda Beat 110cc (2020-sekarang)"
     */
    public function getDisplayNameAttribute(): string
    {
        $years = $this->year_start;
        $years .= $this->year_end ? "-{$this->year_end}" : '-sekarang';

        return "{$this->brand} {$this->model} {$this->engine_cc}cc ({$years})";
    }

    public function parts(): HasMany
    {
        return $this->hasMany(MotorcyclePart::class);
    }

    public function products(): BelongsToMany
    {
        return $this->belongsToMany(Product::class, 'motorcycle_parts')
            ->withPivot('part_category', 'notes', 'is_recommended')
            ->withTimestamps();
    }
}
