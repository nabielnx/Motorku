<?php

namespace App\Services;

use App\Models\Motorcycle;
use App\Models\MotorcyclePart;
use App\Models\Product;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class MotorcycleService
{
    /**
     * Get all motorcycles with parts count.
     */
    public function getAllMotorcycles(): Collection
    {
        return Motorcycle::withCount('parts')
            ->orderBy('brand')
            ->orderBy('model')
            ->get();
    }

    /**
     * Get available products for sparepart mapping.
     */
    public function getAvailableProducts(): Collection
    {
        return Product::with('category')
            ->where('is_available', true)
            ->orderBy('name')
            ->get();
    }

    /**
     * Get human-readable part categories.
     */
    public function getPartCategories(): array
    {
        return MotorcyclePart::categoryLabels();
    }

    /**
     * Get grouped categories for UI optgroups and filtering.
     */
    public function getCategoryGroups(): array
    {
        return MotorcyclePart::categoryGroups();
    }

    /**
     * Find a motorcycle by ID.
     */
    public function getMotorcycleById(string $id): Motorcycle
    {
        return Motorcycle::findOrFail($id);
    }

    /**
     * Create a new motorcycle.
     */
    public function createMotorcycle(array $data): Motorcycle
    {
        if (isset($data['image']) && $data['image'] instanceof \Illuminate\Http\UploadedFile) {
            $path = $data['image']->store('motorcycles', 'public');
            $data['image_url'] = '/storage/' . $path;
            unset($data['image']);
        }

        $data['slug'] = Str::slug(($data['brand'] ?? '') . '-' . ($data['model'] ?? '') . '-' . ($data['year_start'] ?? ''));

        // Ensure slug uniqueness
        $counter = 0;
        $baseSlug = $data['slug'];
        while (Motorcycle::where('slug', $data['slug'])->exists()) {
            $counter++;
            $data['slug'] = $baseSlug . '-' . $counter;
        }

        $motorcycle = Motorcycle::create($data);

        return $motorcycle->loadCount('parts');
    }

    /**
     * Update an existing motorcycle.
     */
    public function updateMotorcycle(string $id, array $data): Motorcycle
    {
        $motorcycle = Motorcycle::findOrFail($id);

        if (isset($data['image']) && $data['image'] instanceof \Illuminate\Http\UploadedFile) {
            // Delete old stored image if exists in public storage
            if ($motorcycle->image_url && str_starts_with($motorcycle->image_url, '/storage/motorcycles/')) {
                $oldPath = str_replace('/storage/', '', $motorcycle->image_url);
                Storage::disk('public')->delete($oldPath);
            }

            $path = $data['image']->store('motorcycles', 'public');
            $data['image_url'] = '/storage/' . $path;
            unset($data['image']);
        }

        $motorcycle->update($data);

        return $motorcycle->fresh()->loadCount('parts');
    }

    /**
     * Delete a motorcycle.
     */
    public function deleteMotorcycle(string $id): bool
    {
        $motorcycle = Motorcycle::findOrFail($id);

        if ($motorcycle->image_url && str_starts_with($motorcycle->image_url, '/storage/motorcycles/')) {
            $oldPath = str_replace('/storage/', '', $motorcycle->image_url);
            Storage::disk('public')->delete($oldPath);
        }

        return (bool) $motorcycle->delete();
    }

    /**
     * Query parts for a motorcycle with filtering and pagination.
     */
    public function getMotorcycleParts(string $motorcycleId, array $filters = []): array
    {
        $motorcycle = Motorcycle::findOrFail($motorcycleId);

        $query = MotorcyclePart::with(['product.category'])
            ->where('motorcycle_id', $motorcycleId);

        // Overall category count summary
        $categoryCounts = MotorcyclePart::where('motorcycle_id', $motorcycleId)
            ->selectRaw('part_category, count(*) as count')
            ->groupBy('part_category')
            ->pluck('count', 'part_category')
            ->toArray();

        $totalMapped = (int) array_sum($categoryCounts);

        // Search filter (Product name, SKU, or notes)
        if (!empty($filters['search'])) {
            $search = trim($filters['search']);
            $query->where(function ($q) use ($search) {
                $q->whereHas('product', function ($pq) use ($search) {
                    $pq->where('name', 'like', "%{$search}%")
                        ->orWhere('sku', 'like', "%{$search}%");
                })->orWhere('notes', 'like', "%{$search}%");
            });
        }

        // Specific category filter
        $category = $filters['part_category'] ?? $filters['category'] ?? null;
        if ($category && $category !== 'semua') {
            $query->where('part_category', $category);
        }

        // Group filter
        $group = $filters['group'] ?? null;
        if ($group && $group !== 'semua') {
            $groups = MotorcyclePart::categoryGroups();
            if (isset($groups[$group]['items'])) {
                $categoryKeys = array_keys($groups[$group]['items']);
                $query->whereIn('part_category', $categoryKeys);
            }
        }

        // Recommendation filter
        if (isset($filters['is_recommended']) && $filters['is_recommended'] !== '' && $filters['is_recommended'] !== null) {
            $isRec = filter_var($filters['is_recommended'], FILTER_VALIDATE_BOOLEAN);
            $query->where('is_recommended', $isRec);
        }

        $query->orderBy('part_category')
            ->orderBy('created_at', 'desc');

        // All items requested
        if (!empty($filters['all']) || ($filters['per_page'] ?? null) === 'all') {
            $parts = $query->get();
            return [
                'data'            => $parts,
                'total'           => $parts->count(),
                'total_mapped'    => $totalMapped,
                'category_counts' => $categoryCounts,
            ];
        }

        $perPage = (int) ($filters['per_page'] ?? 5);
        if ($perPage <= 0) {
            $perPage = 5;
        }

        /** @var LengthAwarePaginator $paginated */
        $paginated = $query->paginate($perPage);

        return [
            'data'            => $paginated->items(),
            'current_page'    => $paginated->currentPage(),
            'last_page'       => $paginated->lastPage(),
            'per_page'        => $paginated->perPage(),
            'total'           => $paginated->total(),
            'from'            => $paginated->firstItem(),
            'to'              => $paginated->lastItem(),
            'total_mapped'    => $totalMapped,
            'category_counts' => $categoryCounts,
        ];
    }

    /**
     * Attach a single sparepart to a motorcycle.
     */
    public function attachPart(string $motorcycleId, array $data): MotorcyclePart
    {
        Motorcycle::findOrFail($motorcycleId);

        $exists = MotorcyclePart::where('motorcycle_id', $motorcycleId)
            ->where('product_id', $data['product_id'])
            ->exists();

        if ($exists) {
            throw new \InvalidArgumentException('Produk ini sudah di-mapping ke motor ini.');
        }

        $data['motorcycle_id'] = $motorcycleId;

        $part = MotorcyclePart::create($data);

        return $part->load('product.category');
    }

    /**
     * Bulk attach spareparts to motorcycles.
     * Supports:
     * - 1 motorcycle -> many products
     * - many motorcycles -> 1 product
     * - many motorcycles -> many products
     *
     * Automatically skips existing mappings without failing the whole batch.
     */
    public function bulkAttachParts(array $data): array
    {
        $motorcycleIds = (array) ($data['motorcycle_ids'] ?? []);
        $productIds = (array) ($data['product_ids'] ?? []);
        $partCategory = $data['part_category'];
        $notes = $data['notes'] ?? null;
        $isRecommended = (bool) ($data['is_recommended'] ?? false);

        $attached = 0;
        $skipped = 0;
        $createdParts = [];

        foreach ($motorcycleIds as $motorId) {
            foreach ($productIds as $prodId) {
                $exists = MotorcyclePart::where('motorcycle_id', $motorId)
                    ->where('product_id', $prodId)
                    ->exists();

                if ($exists) {
                    $skipped++;
                    continue;
                }

                $part = MotorcyclePart::create([
                    'motorcycle_id'  => $motorId,
                    'product_id'     => $prodId,
                    'part_category'  => $partCategory,
                    'notes'          => $notes,
                    'is_recommended' => $isRecommended,
                ]);

                $createdParts[] = $part;
                $attached++;
            }
        }

        return [
            'attached' => $attached,
            'skipped'  => $skipped,
            'total'    => count($motorcycleIds) * count($productIds),
        ];
    }

    /**
     * Update an existing part mapping.
     */
    public function updatePart(string $motorcycleId, string $partId, array $data): MotorcyclePart
    {
        $part = MotorcyclePart::where('motorcycle_id', $motorcycleId)
            ->where('id', $partId)
            ->firstOrFail();

        $part->update($data);

        return $part->load('product.category');
    }

    /**
     * Detach a part mapping.
     */
    public function detachPart(string $motorcycleId, string $partId): bool
    {
        $part = MotorcyclePart::where('motorcycle_id', $motorcycleId)
            ->where('id', $partId)
            ->firstOrFail();

        return (bool) $part->delete();
    }
}
