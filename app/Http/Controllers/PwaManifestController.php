<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class PwaManifestController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $manifest = json_decode(file_get_contents(public_path('manifest.webmanifest')), true, 512, JSON_THROW_ON_ERROR);
        $business = $request->attributes->get('business');
        $slug = $request->attributes->get('shop_slug');
        $start = $slug ? '/s/'.$slug : '/';
        $manifest['id'] = $start;
        $manifest['start_url'] = $start;
        $manifest['name'] = $business?->name ?? $manifest['name'];
        $manifest['short_name'] = mb_substr($manifest['name'], 0, 16);

        return response(json_encode($manifest, JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES), 200, [
            'Content-Type' => 'application/manifest+json',
            'Cache-Control' => 'public, max-age=300',
        ]);
    }
}
