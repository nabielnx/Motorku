<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class MigrateSessionCookie
{
    public function handle(Request $request, Closure $next): Response
    {
        $current = config('session.cookie');

        // This runs after EncryptCookies and before StartSession. Only an
        // authenticated, decrypted legacy cookie may continue the same session.
        if ($current === 'tokom-session' && ! $request->cookies->has($current)) {
            $legacy = $request->cookies->get('motorku-session');
            if (is_string($legacy) && $legacy !== '') {
                $request->cookies->set($current, $legacy);
            }
        }

        return $next($request);
    }
}
