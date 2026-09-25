<?php

use App\Http\Middleware\ApplySystemSettings;
use App\Http\Middleware\EnsureUserIsActive;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Spatie\Permission\Middleware\PermissionMiddleware;
use Spatie\Permission\Middleware\RoleMiddleware;
use Spatie\Permission\Middleware\RoleOrPermissionMiddleware;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        channels: __DIR__.'/../routes/channels.php',
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
            ApplySystemSettings::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
            EnsureUserIsActive::class,
        ]);
        $middleware->alias([
            'role' => RoleMiddleware::class,
            'permission' => PermissionMiddleware::class,
            'role_or_permission' => RoleOrPermissionMiddleware::class,
        ]);

        //
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->respond(function ($response, Throwable $exception, Request $request) {
            if ($response->getStatusCode() === 419) {
                if ($request->header('X-Inertia')) {
                    return back()->with([
                        'error' => 'Sesi telah kadaluarsa & diperbarui. Silakan coba kembali.',
                    ]);
                }
            }

            return $response;
        });

        // Force JSON format for any API errors
        $exceptions->render(function (Throwable $e, Request $request) {
            if ($request->is('api/*')) {
                // If it's a ValidationException, return 422
                if ($e instanceof ValidationException) {
                    return response()->json([
                        'success' => false,
                        'message' => $e->getMessage(),
                        'errors' => $e->errors(),
                    ], 422);
                }

                // If Model Not Found
                if ($e instanceof ModelNotFoundException || $e instanceof NotFoundHttpException) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Data tidak ditemukan.',
                    ], 404);
                }

                // Authentication & Authorization
                if ($e instanceof AuthenticationException) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Unauthenticated.',
                    ], 401);
                }

                if ($e instanceof AuthorizationException || $e instanceof AccessDeniedHttpException) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Unauthorized.',
                    ], 403);
                }

                // Default API Error fallback
                $statusCode = $e instanceof HttpExceptionInterface
                    ? $e->getStatusCode()
                    : 500;

                $message = $e->getMessage() ?: 'Internal Server Error';
                if ($statusCode >= 500 && ! config('app.debug')) {
                    $message = 'Terjadi kesalahan pada server. Silakan coba beberapa saat lagi.';
                }

                return response()->json([
                    'success' => false,
                    'message' => $message,
                ], $statusCode);
            }
        });
    })->create();
