<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Services\CustomerAccountService;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

final class EnsureCustomerAuthenticated
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! Auth::guard('customer')->check()) {
            return $request->expectsJson()
                ? response()->json(['message' => 'Masuk sebagai pelanggan terlebih dahulu.'], 401)
                : redirect(app(CustomerAccountService::class)->url($request, '/customer/login'));
        }

        return $next($request);
    }
}
