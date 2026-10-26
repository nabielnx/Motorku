<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Services\DeletionControlService;
use App\Traits\ApiResponseHelpers;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ControlAdminDeletion
{
    use ApiResponseHelpers;

    public function __construct(private DeletionControlService $deletion) {}

    public function handle(Request $request, Closure $next): Response
    {
        $isDeletion = $request->isMethod('DELETE')
            || (in_array($request->method(), ['POST', 'PUT', 'PATCH'], true) && $request->boolean('remove_image'));
        if ($request->user() && $isDeletion && ! $this->deletion->enabled()) {
            if ($request->header('X-Inertia')) {
                return back()->withErrors(['deletion' => DeletionControlService::MESSAGE])->with('error', DeletionControlService::MESSAGE);
            }

            return $this->errorResponse(DeletionControlService::MESSAGE, 403);
        }

        return $next($request);
    }
}
