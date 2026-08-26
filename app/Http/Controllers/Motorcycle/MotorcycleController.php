<?php

namespace App\Http\Controllers\Motorcycle;

use App\Http\Controllers\Controller;
use App\Http\Requests\Motorcycle\AttachMotorcyclePartRequest;
use App\Http\Requests\Motorcycle\GetMotorcyclePartsRequest;
use App\Http\Requests\Motorcycle\StoreMotorcycleRequest;
use App\Http\Requests\Motorcycle\UpdateMotorcyclePartRequest;
use App\Http\Requests\Motorcycle\UpdateMotorcycleRequest;
use App\Models\Motorcycle;
use App\Models\MotorcyclePart;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class MotorcycleController extends Controller
{
    /**
     * Admin page — manage motorcycles & part mappings.
     */
    public function indexWeb(): Response
    {
        $motorcycles = Motorcycle::withCount('parts')
            ->orderBy('brand')
            ->orderBy('model')
            ->get();

        $products = Product::with('category')
            ->where('is_available', true)
            ->orderBy('name')
            ->get();

        $partCategories = MotorcyclePart::categoryLabels();
        $categoryGroups = MotorcyclePart::categoryGroups();

        return Inertia::render('Motorcycle/Index', [
            'motorcycles'    => $motorcycles,
            'products'       => $products,
            'partCategories' => $partCategories,
            'categoryGroups' => $categoryGroups,
        ]);
    }

    /**
     * API: Store a new motorcycle.
     */
    public function store(StoreMotorcycleRequest $request): JsonResponse
    {
        $data = $request->validated();

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('motorcycles', 'public');
            $data['image_url'] = '/storage/' . $path;
        }

        $data['slug'] = Str::slug($data['brand'] . '-' . $data['model'] . '-' . $data['year_start']);

        // Ensure slug uniqueness
        $counter = 0;
        $baseSlug = $data['slug'];
        while (Motorcycle::where('slug', $data['slug'])->exists()) {
            $counter++;
            $data['slug'] = $baseSlug . '-' . $counter;
        }

        $motorcycle = Motorcycle::create($data);

        return response()->json([
            'message' => 'Motor berhasil ditambahkan.',
            'data'    => $motorcycle->loadCount('parts'),
        ], 201);
    }

    /**
     * API: Update motorcycle.
     */
    public function update(UpdateMotorcycleRequest $request, string $id): JsonResponse
    {
        $motorcycle = Motorcycle::findOrFail($id);
        $data = $request->validated();

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('motorcycles', 'public');
            $data['image_url'] = '/storage/' . $path;
        }

        $motorcycle->update($data);

        return response()->json([
            'message' => 'Motor berhasil diperbarui.',
            'data'    => $motorcycle->fresh()->loadCount('parts'),
        ]);
    }

    /**
     * API: Delete motorcycle.
     */
    public function destroy(string $id): JsonResponse
    {
        $motorcycle = Motorcycle::findOrFail($id);
        $motorcycle->delete();

        return response()->json(['message' => 'Motor berhasil dihapus.']);
    }

    /**
     * API: Get parts mapped to a motorcycle with filtering, search, and pagination.
     */
    public function parts(GetMotorcyclePartsRequest $request, string $id): JsonResponse
    {
        $motorcycle = Motorcycle::findOrFail($id);

        $query = MotorcyclePart::with(['product.category'])
            ->where('motorcycle_id', $id);

        // Calculate overall category counts for this motorcycle
        $categoryCounts = MotorcyclePart::where('motorcycle_id', $id)
            ->selectRaw('part_category, count(*) as count')
            ->groupBy('part_category')
            ->pluck('count', 'part_category')
            ->toArray();

        $totalMapped = (int) array_sum($categoryCounts);

        // Search filter (Product name, SKU, or notes)
        if ($request->filled('search')) {
            $search = trim($request->input('search'));
            $query->where(function ($q) use ($search) {
                $q->whereHas('product', function ($pq) use ($search) {
                    $pq->where('name', 'like', "%{$search}%")
                        ->orWhere('sku', 'like', "%{$search}%");
                })->orWhere('notes', 'like', "%{$search}%");
            });
        }

        // Specific part category filter
        $category = $request->input('part_category') ?: $request->input('category');
        if ($category && $category !== 'semua') {
            $query->where('part_category', $category);
        }

        // Group filter
        $group = $request->input('group');
        if ($group && $group !== 'semua') {
            $groups = MotorcyclePart::categoryGroups();
            if (isset($groups[$group]['items'])) {
                $categoryKeys = array_keys($groups[$group]['items']);
                $query->whereIn('part_category', $categoryKeys);
            }
        }

        // Recommendation filter
        if ($request->has('is_recommended') && $request->input('is_recommended') !== '' && $request->input('is_recommended') !== null) {
            $isRec = filter_var($request->input('is_recommended'), FILTER_VALIDATE_BOOLEAN);
            $query->where('is_recommended', $isRec);
        }

        $query->orderBy('part_category')
            ->orderBy('created_at', 'desc');

        // Check if all requested
        if ($request->boolean('all') || $request->input('per_page') === 'all') {
            $parts = $query->get();
            return response()->json([
                'data'            => $parts,
                'total'           => $parts->count(),
                'total_mapped'    => $totalMapped,
                'category_counts' => $categoryCounts,
            ]);
        }

        $perPage = (int) $request->input('per_page', 5);
        if ($perPage <= 0) {
            $perPage = 5;
        }

        $paginated = $query->paginate($perPage);

        return response()->json([
            'data'            => $paginated->items(),
            'current_page'    => $paginated->currentPage(),
            'last_page'       => $paginated->lastPage(),
            'per_page'        => $paginated->perPage(),
            'total'           => $paginated->total(),
            'from'            => $paginated->firstItem(),
            'to'              => $paginated->lastItem(),
            'total_mapped'    => $totalMapped,
            'category_counts' => $categoryCounts,
        ]);
    }

    /**
     * API: Attach a product to a motorcycle.
     */
    public function attachPart(AttachMotorcyclePartRequest $request, string $id): JsonResponse
    {
        $motorcycle = Motorcycle::findOrFail($id);
        $data = $request->validated();
        $data['motorcycle_id'] = $id;

        // Check for duplicate
        $exists = MotorcyclePart::where('motorcycle_id', $id)
            ->where('product_id', $data['product_id'])
            ->exists();

        if ($exists) {
            return response()->json([
                'message' => 'Produk ini sudah di-mapping ke motor ini.',
                'errors'  => ['product_id' => ['Produk ini sudah di-mapping ke motor ini.']]
            ], 422);
        }

        $part = MotorcyclePart::create($data);

        return response()->json([
            'message' => 'Part berhasil di-mapping.',
            'data'    => $part->load('product.category'),
        ], 201);
    }

    /**
     * API: Update a part mapping (notes, is_recommended, part_category).
     */
    public function updatePart(UpdateMotorcyclePartRequest $request, string $motorcycleId, string $partId): JsonResponse
    {
        $part = MotorcyclePart::where('motorcycle_id', $motorcycleId)
            ->where('id', $partId)
            ->firstOrFail();

        $part->update($request->validated());

        return response()->json([
            'message' => 'Mapping part berhasil diperbarui.',
            'data'    => $part->load('product.category'),
        ]);
    }

    /**
     * API: Detach a part from motorcycle.
     */
    public function detachPart(string $motorcycleId, string $partId): JsonResponse
    {
        $part = MotorcyclePart::where('motorcycle_id', $motorcycleId)
            ->where('id', $partId)
            ->firstOrFail();

        $part->delete();

        return response()->json(['message' => 'Part berhasil dihapus dari motor.']);
    }
}

