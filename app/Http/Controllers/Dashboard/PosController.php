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
        $settings = Setting::all()->mapWithKeys(fn($s) => [
            $s->group . '.' . $s->key => $s->value
        ])->toArray();

        return Inertia::render('POS/Index', [
            'initialProducts'   => Product::with(['category', 'motorcycles'])->where('is_available', true)->get(),
            'initialCategories' => Category::all(),
            'settings'          => $settings,
        ]);
    }
}
