<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class StoreEntryController extends Controller
{
    public function __invoke(Request $request): Response|RedirectResponse
    {
        $business = $request->attributes->get('business');

        return $business
            ? redirect()->route('shop.home', ['businessSlug' => $business->slug])
            : Inertia::render('Store/Entry');
    }
}
