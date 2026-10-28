<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\DataType;
use App\Models\Setting;

final class PublicReferenceService
{
    public function modules(): array
    {
        if (Setting::where('group', 'qr_order')->where('key', 'enabled')->value('value') === 'false') {
            return [];
        }
        $settings = app(SettingService::class);
        $motorEnabled = $settings->publicMotorcyclesEnabled();
        $otherEnabled = $settings->referencesEnabled();
        if (! $motorEnabled && ! $otherEnabled) {
            return [];
        }

        return DataType::where('kind', 'reference')->where(function ($query) use ($motorEnabled, $otherEnabled): void {
            if ($motorEnabled) {
                $query->orWhere('driver', 'motorcycles');
            }
            if ($otherEnabled) {
                $query->orWhere(fn ($custom) => $custom->whereNull('driver')->where('is_public', true));
            }
        })->orderBy('name')
            ->get(['id', 'name', 'driver'])->map(fn ($type) => [
                'id' => $type->id, 'name' => $type->name,
                'path' => $type->driver === 'motorcycles' ? '/motor-saya' : '/cari-kecocokan/'.$type->id,
            ])->all();
    }

    public function type(string $id): DataType
    {
        $type = DataType::where('kind', 'reference')->findOrFail($id);
        $settings = app(SettingService::class);
        abort_unless($type->driver === 'motorcycles' ? $settings->publicMotorcyclesEnabled() : ($settings->referencesEnabled() && $type->is_public), 404);

        return $type;
    }

    public function page(?DataType $type, ?string $entryId, array $filters): array
    {
        $search = trim($filters['search'] ?? '');
        $data = ['selectedType' => $type ? ['id' => $type->id, 'name' => $type->name] : null,
            'selectedEntry' => null, 'entries' => null, 'products' => null, 'filters' => ['search' => $search]];
        if (! $type) {
            return $data;
        }
        if ($entryId) {
            $entry = $type->entries()->findOrFail($entryId);
            $data['selectedEntry'] = ['id' => $entry->id, 'name' => $entry->name, 'image' => $entry->image_path ? '/storage/'.$entry->image_path : null];
            $products = $entry->products()->where('is_available', true)->orderBy('products.name')->orderBy('products.id')
                ->paginate(12, ['products.id', 'products.name', 'products.sku', 'products.brand', 'products.unit', 'products.price', 'products.stock', 'products.image_path']);
            $products->setCollection($products->getCollection()->map(fn ($product) => [
                'id' => $product->id, 'name' => $product->name, 'sku' => $product->sku,
                'brand' => $product->brand, 'unit' => $product->unit, 'price' => (float) $product->price,
                'stock' => (int) $product->stock, 'image' => $product->image_path ? '/storage/'.$product->image_path : null,
            ]));
            $data['products'] = $products;

            return $data;
        }

        $entries = $type->entries()->select(['id', 'name', 'image_path'])
            ->withCount(['products' => fn ($query) => $query->where('is_available', true)])
            ->when($search !== '', fn ($query) => $query->where('name', 'like', '%'.addcslashes($search, '%_\\').'%'))
            ->orderBy('name')->orderBy('id')->paginate(12);
        $entries->setCollection($entries->getCollection()->map(fn ($entry) => [
            'id' => $entry->id, 'name' => $entry->name, 'products_count' => $entry->products_count,
            'image' => $entry->image_path ? '/storage/'.$entry->image_path : null,
        ]));
        $data['entries'] = $entries;

        return $data;
    }
}
