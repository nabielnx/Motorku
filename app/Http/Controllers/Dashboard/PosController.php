<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Product;
use App\Models\Setting;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Inertia\Inertia;
use Inertia\Response;

class PosController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('role:owner|cashier'),
        ];
    }

    public function index(): Response
    {
        $settings = Setting::all()->mapWithKeys(fn ($s) => [
            $s->group.'.'.$s->key => $s->value,
        ])->toArray();

        return Inertia::render('POS/Index', [
            'initialProducts' => Product::with([
                'category:id,name,parent_id',
                'category.parent:id,name',
                'motorcycles:id,brand,model',
            ])
                ->where('is_available', true)
                ->select([
                    'id', 'category_id', 'sku', 'name', 'description',
                    'brand', 'barcode', 'unit', 'rack_location',
                    'price', 'stock', 'image_path', 'is_available',
                ])
                ->get(),
            'initialCategories' => Category::all(),
            'settings' => $settings,
        ]);
    }
}
