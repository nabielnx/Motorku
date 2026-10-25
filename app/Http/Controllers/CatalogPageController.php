<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\CatalogPageRequest;
use App\Models\Setting;
use App\Services\CatalogPageService;
use Illuminate\Http\JsonResponse;

final class CatalogPageController extends Controller
{
    public function __invoke(CatalogPageRequest $request, CatalogPageService $catalog): JsonResponse
    {
        $public = $request->attributes->get('public_store');
        $enabled = ! $public || Setting::where('group', 'qr_order')->where('key', 'enabled')->value('value') !== 'false';
        $filters = $request->validated();
        $page = $enabled && ! array_key_exists('ids', $filters) ? $catalog->page($filters) : ['products' => [], 'pagination' => ['page' => 1, 'next_page' => null, 'total' => 0]];
        $settings = Setting::whereIn('group', ['tax', 'payment'])->whereIn('key', ['enabled', 'percentage', 'cash_enabled', 'qris_enabled'])->get()->mapWithKeys(fn ($setting) => [$setting->group.'.'.$setting->key => $setting->value]);

        return response()->json(['data' => [...$page, 'cart_products' => $enabled ? $catalog->cart($filters['ids'] ?? []) : [], 'settings' => $settings]])
            ->header('Cache-Control', 'private, no-store');
    }
}
