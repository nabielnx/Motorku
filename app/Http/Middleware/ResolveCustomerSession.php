<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

final class ResolveCustomerSession
{
    public function handle(Request $request, Closure $next): Response
    {
        $customer = Auth::guard('customer')->user();
        if ($customer && (int) $request->session()->get('customer_auth_version') !== (int) $customer->auth_version) {
            Auth::guard('customer')->logout();
            $request->session()->forget('customer_auth_version');
            $request->session()->regenerate();
            $request->session()->regenerateToken();
        }
        $response = $next($request);
        if ($customer || $request->routeIs('customer.*')) {
            $response->headers->set('Cache-Control', 'private, no-store');
        }

        return $response;
    }
}
