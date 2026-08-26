<?php

namespace App\Http\Controllers\Motorcycle;

use App\Http\Controllers\Controller;
use App\Models\Motorcycle;
use App\Models\MotorcyclePart;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response;

class MotorSayaController extends Controller
{
    /**
     * Public customer page — "Motor Saya" motorcycle part finder.
     */
    public function index(): Response
    {
        $motorcycles = Motorcycle::withCount('parts')
            ->orderBy('brand')
            ->orderBy('model')
            ->get()
            ->groupBy('brand');

        $settings = Setting::all()->mapWithKeys(fn($s) => [
            $s->group . '.' . $s->key => $s->value
        ])->toArray();

        $partCategories = MotorcyclePart::categoryLabels();

        return Inertia::render('Motorcycle/MotorSaya', [
            'motorcyclesByBrand' => $motorcycles,
            'settings'           => $settings,
            'partCategories'     => $partCategories,
        ]);
    }

    /**
     * API: Get compatible parts for a motorcycle, grouped by category.
     */
    public function compatibleParts(string $motorcycleId): JsonResponse
    {
        $motorcycle = Motorcycle::findOrFail($motorcycleId);

        $parts = MotorcyclePart::with(['product.category'])
            ->where('motorcycle_id', $motorcycleId)
            ->whereHas('product', fn($q) => $q->where('is_available', true))
            ->orderBy('part_category')
            ->get();

        $grouped = $parts->groupBy('part_category')->map(function ($items, $category) {
            return [
                'category'       => $category,
                'category_label' => MotorcyclePart::categoryLabels()[$category] ?? $category,
                'items'          => $items->map(fn($mp) => [
                    'id'             => $mp->product->id,
                    'name'           => $mp->product->name,
                    'sku'            => $mp->product->sku,
                    'description'    => $mp->product->description,
                    'price'          => (float) $mp->product->price,
                    'stock'          => (int) $mp->product->stock,
                    'image'          => $mp->product->image_path
                        ? ($mp->product->image_path[0] === 'h' ? $mp->product->image_path : '/storage/' . $mp->product->image_path)
                        : null,
                    'category_name'  => $mp->product->category?->name,
                    'notes'          => $mp->notes,
                    'is_recommended' => $mp->is_recommended,
                ]),
            ];
        })->values();

        return response()->json([
            'motorcycle' => [
                'id'           => $motorcycle->id,
                'brand'        => $motorcycle->brand,
                'model'        => $motorcycle->model,
                'display_name' => $motorcycle->display_name,
                'engine_cc'    => $motorcycle->engine_cc,
                'engine_type'  => $motorcycle->engine_type,
                'year_start'   => $motorcycle->year_start,
                'year_end'     => $motorcycle->year_end,
                'image_url'    => $motorcycle->image_url,
            ],
            'parts'      => $grouped,
        ]);
    }
}
