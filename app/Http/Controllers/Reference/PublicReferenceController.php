<?php

declare(strict_types=1);

namespace App\Http\Controllers\Reference;

use App\Http\Controllers\Controller;
use App\Http\Requests\Reference\PublicReferenceRequest;
use App\Services\PublicReferenceService;
use App\Services\SettingService;
use Inertia\Inertia;

final class PublicReferenceController extends Controller
{
    public function __invoke(PublicReferenceRequest $request, PublicReferenceService $references, ?string $type = null, ?string $entry = null)
    {
        $settings = app(SettingService::class)->publicValues();
        $enabled = ($settings['qr_order.enabled'] ?? 'true') !== 'false';
        $selected = $enabled && $type ? $references->type($type) : null;
        if ($selected?->driver === 'motorcycles') {
            abort_if($entry !== null, 404);

            return redirect()->route('motor-saya', ['shop' => $request->attributes->get('shop_slug')]);
        }

        return Inertia::render('Reference/Finder', [
            ...$references->page($selected, $enabled ? $entry : null, $request->validated()),
            'types' => $enabled ? $references->modules() : [], 'settings' => $settings,
        ])->toResponse($request)->header('Cache-Control', 'private, no-store');
    }
}
