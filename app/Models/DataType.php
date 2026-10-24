<?php

declare(strict_types=1);

namespace App\Models;

use App\Models\Concerns\BelongsToBusiness;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DataType extends Model
{
    use BelongsToBusiness;
    use HasUuids;

    protected $fillable = ['kind', 'key', 'name', 'fields'];

    protected $attributes = ['sync_version' => 1];

    protected $casts = ['fields' => 'array', 'is_system' => 'boolean', 'sync_version' => 'integer'];

    public function entries(): HasMany
    {
        return $this->hasMany(ReferenceEntry::class);
    }

    public static function productGroups(?string $businessId = null): array
    {
        return self::where('kind', 'product')
            ->when($businessId !== null, fn ($query) => $query->where('business_id', $businessId))
            ->orderBy('position')->orderBy('name')->pluck('name', 'key')->all();
    }

    public static function referenceModules(?string $businessId = null): array
    {
        return self::where('kind', 'reference')
            ->when($businessId !== null, fn ($query) => $query->where('business_id', $businessId))
            ->orderBy('name')->get(['id', 'key', 'name', 'driver'])->map(fn ($type) => [
                'key' => $type->key, 'name' => $type->name,
                'path' => $type->driver === 'motorcycles' ? '/motorcycles' : '/references/'.$type->id,
            ])->all();
    }
}
