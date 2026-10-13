<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Vite;
use Symfony\Component\HttpFoundation\Response;

class SecurityHeaders
{
    public function handle(Request $request, Closure $next): Response
    {
        Vite::useCspNonce();

        return self::apply($request, $next($request));
    }

    public static function apply(Request $request, Response $response): Response
    {
        $nonce = Vite::cspNonce() ?? Vite::useCspNonce();
        $policy = implode('; ', [
            "default-src 'self'",
            "script-src 'self' 'nonce-{$nonce}'",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.bunny.net",
            "img-src 'self' data: blob: https:",
            "media-src 'self' blob:",
            "font-src 'self' data: https://fonts.gstatic.com https://fonts.bunny.net",
            "connect-src 'self'",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            "frame-ancestors 'self'",
        ]);

        // Vite's local HMR has a separate origin. Enforce the production policy in staging/testing.
        $header = config('security.csp_enforce') && ! app()->environment('local')
            ? 'Content-Security-Policy'
            : 'Content-Security-Policy-Report-Only';
        $response->headers->set($header, $policy);
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('X-Frame-Options', 'SAMEORIGIN');
        if (! $response->headers->has('Referrer-Policy')) {
            $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        }
        // The image picker requests camera access only after an explicit user action.
        $response->headers->set('Permissions-Policy', 'camera=(self), microphone=(), geolocation=()');
        if ($request->isSecure() && app()->environment(['production', 'staging'])) {
            // Do not impose a policy on sibling subdomains of a shared hosting domain.
            $response->headers->set('Strict-Transport-Security', 'max-age=86400');
        }

        return $response;
    }
}
