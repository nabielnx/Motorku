<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Category;
use App\Models\DataType;
use App\Models\Motorcycle;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class DataTypeService
{
    public function listing(string $businessId): array
    {
        $categoryCounts = Category::where('business_id', $businessId)->selectRaw('catalog_group, COUNT(*) as total')->groupBy('catalog_group')->pluck('total', 'catalog_group');
        $motorcycleCount = Motorcycle::where('business_id', $businessId)->count();

        return DataType::where('business_id', $businessId)->withCount([
            'entries' => fn ($query) => $query->where('business_id', $businessId),
        ])->orderBy('created_at')->orderBy('name')->get()->map(fn ($type) => [
            ...$type->toArray(), 'categories_count' => (int) ($categoryCounts[$type->key] ?? 0),
            'records_count' => $type->driver === 'motorcycles' ? $motorcycleCount : $type->entries_count,
        ])->all();
    }

    public function save(array $input, ?DataType $type = null): DataType
    {
        return DB::transaction(function () use ($input, $type) {
            if ($type) {
                $type = DataType::whereKey($type->id)->lockForUpdate()->firstOrFail();
                if ($type->sync_version !== (int) $input['version'] || $type->kind !== $input['kind']) {
                    $this->fail('Jenis data berubah. Muat ulang sebelum menyimpan.');
                }
            }
            $fields = array_map(fn ($field) => [...$field, 'required' => (bool) $field['required']], $input['fields']);
            $legacyKey = array_search(mb_strtolower($input['name']), array_map('mb_strtolower', Category::CATALOG_GROUPS), true);
            if ($input['kind'] === 'product' && $legacyKey !== false && $type?->key !== $legacyKey
                && DataType::where('kind', 'product')->where('key', $legacyKey)->exists()) {
                $this->fail('Nama tersebut masih dipakai sebagai alias jenis produk bawaan. Gunakan nama lain.');
            }
            if (($input['kind'] === 'product' || $type?->driver) && $fields !== []) {
                $this->fail('Kolom fleksibel hanya tersedia untuk jenis referensi baru.');
            }
            foreach ($fields as $field) {
                if ($field['type'] === 'select' && ($field['options'] === [] || count(array_unique($field['options'])) !== count($field['options']))) {
                    $this->fail('Kolom pilihan harus memiliki opsi yang terisi dan tidak ganda.');
                }
                if ($field['type'] !== 'select' && $field['options'] !== []) {
                    $this->fail('Opsi hanya dipakai pada kolom pilihan.');
                }
            }
            if ($type && $fields !== $type->fields && $type->entries()->exists()) {
                $next = collect($fields)->keyBy('key');
                $previous = collect($type->fields)->keyBy('key');
                foreach ($type->fields as $old) {
                    if (! isset($next[$old['key']]) || $next[$old['key']]['type'] !== $old['type']) {
                        $this->fail('Kolom pada jenis yang sudah berisi data tidak dapat dihapus atau diganti tipenya.');
                    }
                }
                $needsValidation = collect($fields)->contains(fn ($field) => ($field['required'] && ! ($previous[$field['key']]['required'] ?? false))
                    || ($field['type'] === 'select' && array_diff($previous[$field['key']]['options'] ?? [], $field['options']) !== []));
                // Labels, order and new optional fields do not need to scan existing data.
                foreach ($needsValidation ? $type->entries()->select(['id', 'values'])->lazyById(100) : [] as $entry) {
                    try {
                        app(ReferenceSchemaService::class)->validate($fields, $entry->values);
                    } catch (ValidationException) {
                        $this->fail('Kolom baru atau opsi yang diubah belum sesuai dengan data tersimpan. Gunakan kolom opsional atau lengkapi data terlebih dahulu.');
                    }
                }
            }
            if (! $type) {
                return DataType::create(['kind' => $input['kind'], 'name' => $input['name'], 'fields' => $fields,
                    'is_public' => $input['kind'] === 'reference' && ($input['is_public'] ?? false),
                    'key' => substr(Str::slug($input['name'], '_') ?: 'jenis', 0, 60).'_'.Str::lower(Str::random(8))]);
            }
            $type->fill(['name' => $input['name'], 'fields' => $fields]);
            if ($type->kind === 'reference' && array_key_exists('is_public', $input)) {
                $type->is_public = (bool) $input['is_public'];
            }
            $type->sync_version++;
            $type->save();

            return $type;
        });
    }

    public function delete(DataType $type): void
    {
        DB::transaction(function () use ($type) {
            $type = DataType::whereKey($type->id)->lockForUpdate()->firstOrFail();
            if ($type->kind === 'product') {
                while ($category = Category::where('catalog_group', $type->key)->orderBy('id')->first(['id'])) {
                    app(CategoryService::class)->deleteCategory($category->id);
                }
            } elseif ($type->driver === 'motorcycles') {
                Motorcycle::orderBy('id')->eachById(fn ($motorcycle) => app(MotorcycleService::class)->deleteMotorcycle($motorcycle->id), 100);
            } else {
                $type->entries()->eachById(fn ($entry) => app(ReferenceService::class)->delete($type, $entry), 100);
            }
            $type->delete();
            DB::afterCommit(fn () => CacheService::flushMotorcycles());
        }, 3);
    }

    private function fail(string $message): never
    {
        throw ValidationException::withMessages(['type' => $message]);
    }
}
