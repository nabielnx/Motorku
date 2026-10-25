<?php

declare(strict_types=1);

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Setting;
use App\Services\CatalogPageService;
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
        $catalogPage = app(CatalogPageService::class)->page();
        $products = $catalogPage['products'];

        return Inertia::render('POS/Index', [
            'initialProducts' => $products,
            'initialPagination' => $catalogPage['pagination'],
            'initialCategories' => fn () => Category::all(),
            'settings' => fn () => Setting::all()->mapWithKeys(fn ($s) => [$s->group.'.'.$s->key => $s->value])->toArray(),
        ]);
    }
}
