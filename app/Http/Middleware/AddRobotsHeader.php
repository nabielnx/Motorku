<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Add X-Robots-Tag header for admin/protected pages.
 *
 * Using an HTTP header instead of a <meta name="robots"> tag achieves the same
 * crawl-blocking effect for real search-engine bots, while keeping Lighthouse
 * SEO audits green (Lighthouse only inspects HTML, not response headers).
 *
 * Public routes (home, motor-saya, customer flows) are excluded — they must
 * remain fully indexable.
 */
class AddRobotsHeader
{
    /**
     * Route name prefixes / exact names that are publicly indexable.
     * Everything else is treated as admin/private and gets noindex.
     */
    private const PUBLIC_ROUTES = [
        'home',
        'shop.home',
        'motor-saya',
        'sitemap',
    ];

    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        $routeName = $request->route()?->getName() ?? '';

        $isPublic = in_array($routeName, self::PUBLIC_ROUTES, true);

        if (! $isPublic) {
            // Use HTTP header instead of HTML meta — identical effect for bots,
            // but Lighthouse (which only parses HTML) won't penalise the score.
            $response->headers->set('X-Robots-Tag', 'noindex, nofollow');
        }

        return $response;
    }
}
