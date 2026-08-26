<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->validateCsrfTokens(except: [
            'api/customer/*',
            'api/webhook/*',
            'webhook/*',
        ]);

        $middleware->redirectGuestsTo(function (Request $request): string {
            if ($request->expectsJson()) {
                return '';
            }

            
            $hadSession = $request->hasSession() && $request->session()->has('_token');

            return $hadSession ? '/login?expired=1' : '/login';
        });

        $middleware->redirectUsersTo(function (Request $request): string {
            $user = $request->user();

            return $user?->hasRole('cashier') ? '/pos' : '/dashboard';
        });

        $middleware->web(append: [
            \App\Http\Middleware\ApplySystemSettings::class,
            \App\Http\Middleware\HandleInertiaRequests::class,
            \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class,
            \App\Http\Middleware\EnsureUserIsActive::class,
        ]);
        $middleware->alias([
            'role' => \Spatie\Permission\Middleware\RoleMiddleware::class,
            'permission' => \Spatie\Permission\Middleware\PermissionMiddleware::class,
            'role_or_permission' => \Spatie\Permission\Middleware\RoleOrPermissionMiddleware::class,
        ]);

        //
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->respond(function ($response, \Throwable $exception, Request $request) {
            if ($response->getStatusCode() === 419) {
                if ($request->header('X-Inertia')) {
                    return back()->with([
                        'error' => 'Sesi telah kadaluarsa & diperbarui. Silakan coba kembali.',
                    ]);
                }
            }
            return $response;
        });
    })->create();
