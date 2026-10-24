<?php

declare(strict_types=1);

namespace App\Services;

use Closure;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;

/** Explicit request/job context. Never infer ownership from submitted form data. */
final class BusinessContext
{
    public const LEGACY_ID = '00000000-0000-4000-8000-000000000001';

    private ?string $businessId = null;

    private ?bool $schemaReady = null;

    public function ready(): bool
    {
        return $this->schemaReady ??= Schema::hasColumn('users', 'business_id');
    }

    public function resetSchema(): void
    {
        $this->schemaReady = null;
    }

    public function id(): string
    {
        return $this->businessId ?? self::LEGACY_ID;
    }

    public function run(string $businessId, Closure $callback): mixed
    {
        $previous = $this->businessId;
        $this->businessId = $businessId;
        try {
            return $callback();
        } finally {
            $this->businessId = $previous;
        }
    }

    public function table(string $table): Builder
    {
        $query = DB::table($table);

        return $this->ready() ? $query->where($table.'.business_id', $this->id()) : $query;
    }

    public function attributes(array $attributes): array
    {
        return $this->ready() ? ['business_id' => $this->id(), ...$attributes] : $attributes;
    }

    public function key(string $key): string
    {
        return 'business:'.$this->id().':'.$key;
    }

    public function assertReferences(Model $model): void
    {
        $references = [
            'categories' => ['parent_id' => 'categories'],
            'products' => ['category_id' => 'categories'],
            'motorcycle_parts' => ['motorcycle_id' => 'motorcycles', 'product_id' => 'products'],
            'orders' => ['cashier_id' => 'users'],
            'order_items' => ['order_id' => 'orders', 'product_id' => 'products'],
            'payments' => ['order_id' => 'orders', 'user_id' => 'users'],
            'inventory_logs' => ['product_id' => 'products', 'user_id' => 'users'],
            'order_returns' => ['order_id' => 'orders', 'order_item_id' => 'order_items', 'user_id' => 'users'],
            'cash_closings' => ['user_id' => 'users'],
            'reference_entries' => ['data_type_id' => 'data_types'],
        ];
        foreach ($references[$model->getTable()] ?? [] as $column => $table) {
            if ($model->isDirty($column) && $model->getAttribute($column) !== null
                && ! $this->table($table)->where('id', $model->getAttribute($column))->exists()) {
                throw ValidationException::withMessages([$column => 'Data tidak tersedia untuk usaha ini.']);
            }
        }
    }
}
