<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DataType extends Model
{
    use HasUuids;

    protected $fillable = ['kind', 'key', 'name', 'fields'];

    protected $attributes = ['sync_version' => 1];

    protected $casts = ['fields' => 'array', 'is_system' => 'boolean', 'sync_version' => 'integer'];

    public function entries(): HasMany
    {
        return $this->hasMany(ReferenceEntry::class);
    }

    public static function productGroups(): array
    {
        return self::where('kind', 'product')->orderBy('position')->orderBy('name')->pluck('name', 'key')->all();
    }

    public static function referenceModules(): array
    {
        return self::where('kind', 'reference')->orderBy('name')->get(['id', 'key', 'name', 'driver'])->map(fn ($type) => [
            'key' => $type->key, 'name' => $type->name,
            'path' => $type->driver === 'motorcycles' ? '/motorcycles' : '/references/'.$type->id,
        ])->all();
    }
}
