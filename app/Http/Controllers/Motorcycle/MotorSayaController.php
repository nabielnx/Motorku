<?php

namespace App\Http\Controllers\Motorcycle;

use App\Http\Controllers\Controller;
use App\Models\Motorcycle;
use App\Models\MotorcyclePart;
use App\Models\Setting;
use App\Services\CacheService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class MotorSayaController extends Controller
{
    /**
     * Public customer page — "Motor Saya" motorcycle part finder.
     */
    public function index(?string $slug = null): Response
    {
        $motorcycles = Cache::remember(CacheService::MOTORCYCLES_LIST, CacheService::TTL_MOTORCYCLE, function () {
            return Motorcycle::withCount('parts')
                ->orderBy('brand')
                ->orderBy('model')
                ->get()
                ->groupBy('brand')
                ->map(fn ($group) => $group->toArray())
                ->toArray();
        });

        $settings = Cache::remember(CacheService::SETTINGS_ALL, CacheService::TTL_SETTINGS, function () {
            return Setting::all()->mapWithKeys(fn ($s) => [
                $s->group.'.'.$s->key => $s->value,
            ])->toArray();
        });

        $partCategories = MotorcyclePart::categoryLabels();

        $initialPartsData = null;

        if ($slug) {
            $motorcycle = Motorcycle::where('slug', $slug)
                ->orWhere('id', $slug)
                ->orWhere('slug', 'like', $slug . '%')
                ->first();

            if ($motorcycle) {
                $initialPartsData = $this->buildMotorcyclePartsData($motorcycle);
            }
        }

        return Inertia::render('Motorcycle/MotorSaya', [
            'motorcyclesByBrand' => $motorcycles,
            'settings' => $settings,
            'partCategories' => $partCategories,
            'initialPartsData' => $initialPartsData,
        ]);
    }

    /**
     * API: Get compatible parts for a motorcycle, grouped by category.
     */
    public function compatibleParts(string $motorcycleId): JsonResponse
    {
        $motorcycle = Motorcycle::where('id', $motorcycleId)
            ->orWhere('slug', $motorcycleId)
            ->firstOrFail();

        return response()->json($this->buildMotorcyclePartsData($motorcycle));
    }

    /**
     * Helper to build motorcycle details and grouped compatible parts.
     * Cached per motorcycle with version-based invalidation.
     */
    private function buildMotorcyclePartsData(Motorcycle $motorcycle): array
    {
        $cacheKey = CacheService::motorcyclePartsKey($motorcycle->id);

        return Cache::remember($cacheKey, CacheService::TTL_MOTORCYCLE, function () use ($motorcycle) {
            $parts = MotorcyclePart::with(['product.category'])
                ->where('motorcycle_id', $motorcycle->id)
                ->whereHas('product', fn ($q) => $q->where('is_available', true))
                ->orderBy('part_category')
                ->get();

            $grouped = $parts->groupBy('part_category')->map(function ($items, $category) {
                return [
                    'category' => $category,
                    'category_label' => MotorcyclePart::categoryLabels()[$category] ?? $category,
                    'items' => $items->map(fn ($mp) => [
                        'id' => $mp->product->id,
                        'name' => $mp->product->name,
                        'sku' => $mp->product->sku,
                        'description' => $mp->product->description,
                        'price' => (float) $mp->product->price,
                        'stock' => (int) $mp->product->stock,
                        'image' => $mp->product->image_path
                            ? ($mp->product->image_path[0] === 'h' ? $mp->product->image_path : '/storage/'.$mp->product->image_path)
                            : null,
                        'category_name' => $mp->product->category?->name,
                        'notes' => $mp->notes,
                        'is_recommended' => $mp->is_recommended,
                    ])->values()->toArray(),
                ];
            })->values()->toArray();

            return [
                'motorcycle' => [
                    'id' => $motorcycle->id,
                    'brand' => $motorcycle->brand,
                    'model' => $motorcycle->model,
                    'slug' => $motorcycle->slug,
                    'display_name' => $motorcycle->display_name,
                    'engine_cc' => $motorcycle->engine_cc,
                    'engine_type' => $motorcycle->engine_type,
                    'year_start' => $motorcycle->year_start,
                    'year_end' => $motorcycle->year_end,
                    'image_url' => $motorcycle->image_url,
                ],
                'parts' => $grouped,
            ];
        });
    }
}
