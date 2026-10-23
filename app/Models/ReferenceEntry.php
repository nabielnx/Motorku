<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class ReferenceEntry extends Model
{
    use HasUuids;

    protected $fillable = ['name', 'description', 'values', 'image_path'];

    protected $attributes = ['sync_version' => 1];

    protected $casts = ['values' => 'array', 'sync_version' => 'integer'];

    public function dataType(): BelongsTo
    {
        return $this->belongsTo(DataType::class);
    }

    public function products(): BelongsToMany
    {
        return $this->belongsToMany(Product::class, 'reference_entry_product')->withTimestamps();
    }
}
