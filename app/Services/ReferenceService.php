<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\DataType;
use App\Models\Product;
use App\Models\ReferenceEntry;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Throwable;

class ReferenceService
{
    public function assertGeneric(DataType $type): void
    {
        abort_unless($type->kind === 'reference' && $type->driver === null, 404);
    }

    public function entries(DataType $type, string $search)
    {
        $this->assertGeneric($type);

        return $type->entries()->with('products:id,name,sku,price,stock,unit,image_path')
            ->when($search !== '', fn ($query) => $query->where('name', 'like', '%'.addcslashes($search, '%_\\').'%'))
            ->orderBy('name')->orderBy('id')->paginate(12)->withQueryString();
    }

    public function products(DataType $type, string $search)
    {
        $this->assertGeneric($type);

        return Product::select(['id', 'name', 'sku', 'price', 'stock', 'unit', 'image_path'])
            ->when($search !== '', fn ($query) => $query->where(function ($query) use ($search) {
                $pattern = '%'.addcslashes($search, '%_\\').'%';
                $query->where('name', 'like', $pattern)->orWhere('sku', 'like', $pattern);
            }))->orderBy('name')->orderBy('id')->paginate(20)->withQueryString();
    }

    public function save(DataType $type, array $input, ?ReferenceEntry $entry = null): ReferenceEntry
    {
        $this->assertGeneric($type);
        abort_if($entry && $entry->data_type_id !== $type->id, 404);
        $newPath = null;
        $committed = false;
        try {
            return DB::transaction(function () use ($type, $entry, $input, &$newPath, &$committed) {
                $type = DataType::whereKey($type->id)->lockForUpdate()->firstOrFail();
                if ($type->sync_version !== (int) $input['schema_version']) {
                    throw ValidationException::withMessages(['schema_version' => 'Susunan kolom berubah. Muat ulang halaman sebelum menyimpan.']);
                }
                if ($entry) {
                    $entry = $type->entries()->whereKey($entry->id)->lockForUpdate()->firstOrFail();
                    if ($entry->sync_version !== (int) $input['version']) {
                        throw ValidationException::withMessages(['version' => 'Data sudah diubah. Muat ulang sebelum menyimpan.']);
                    }
                }
                $values = app(ReferenceSchemaService::class)->validate($type->fields, $input['values'] ?? []);
                $oldPath = $entry?->image_path;
                $path = $oldPath;
                if (($input['image'] ?? null) instanceof UploadedFile) {
                    $newPath = app(ImageUploadService::class)->store($input['image'], 'references');
                    $path = $newPath;
                } elseif ($input['remove_image'] ?? false) {
                    $path = null;
                }
                $data = ['name' => trim($input['name']), 'description' => $input['description'] ?? null, 'values' => $values, 'image_path' => $path];
                if ($entry) {
                    $entry->fill($data);
                    $entry->sync_version++;
                    $entry->save();
                } else {
                    $entry = $type->entries()->create($data);
                }
                if (array_key_exists('product_ids', $input)) {
                    $existing = $entry->products()->pluck('reference_entry_product.id', 'products.id');
                    $entry->products()->sync(collect($input['product_ids'])->mapWithKeys(fn ($id) => [$id => ['id' => $existing[$id] ?? (string) Str::uuid()]])->all());
                }
                DB::afterCommit(function () use (&$committed, $oldPath, $path) {
                    // Cleanup failure must never remove the newly committed image.
                    $committed = true;
                    if ($oldPath && $oldPath !== $path) {
                        $this->removeImage($oldPath);
                    }
                });

                return $entry->load('products:id,name,sku,price,stock,unit,image_path');
            });
        } catch (Throwable $exception) {
            if ($newPath && ! $committed) {
                Storage::disk('public')->delete($newPath);
            }
            throw $exception;
        }
    }

    public function delete(DataType $type, ReferenceEntry $entry): void
    {
        $this->assertGeneric($type);
        abort_unless($entry->data_type_id === $type->id, 404);
        DB::transaction(function () use ($type, $entry) {
            DataType::whereKey($type->id)->lockForUpdate()->firstOrFail();
            $entry = $type->entries()->whereKey($entry->id)->lockForUpdate()->firstOrFail();
            $path = $entry->image_path;
            $entry->delete();
            if ($path) {
                DB::afterCommit(fn () => $this->removeImage($path));
            }
        });
    }

    private function removeImage(string $path): void
    {
        if (str_starts_with($path, 'references/') && ! str_contains($path, '..') && ! ReferenceEntry::where('image_path', $path)->exists()) {
            Storage::disk('public')->delete($path);
        }
    }
}
