<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsActive
{
    /**
     * Reject requests from deactivated staff accounts and invalidate their session.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user() && ! $request->user()->is_active) {
            $request->user()->tokens()->delete();
            if ($request->hasSession()) {
                Auth::guard('web')->logout();
                $request->session()->invalidate();
                $request->session()->regenerateToken();
            }

            if ($request->expectsJson()) {
                return response()->json(['message' => 'Akun Anda telah dinonaktifkan.'], 403);
            }

            $response = redirect()->route('login');

            return $request->hasSession()
                ? $response->with('error', 'Akun Anda telah dinonaktifkan. Hubungi pemilik toko.')
                : $response;
        }

        return $next($request);
    }
}
