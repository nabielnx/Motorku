<?php

declare(strict_types=1);

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Services\CustomerHistoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

final class CustomerHistoryController extends Controller
{
    public function index(Request $request, CustomerHistoryService $history): JsonResponse
    {
        $data = $request->validate(['filter' => ['sometimes', 'in:all,active,closed'], 'page' => ['sometimes', 'integer', 'min:1', 'max:100000']]);

        return response()->json($history->list(Auth::guard('customer')->user(), $data['filter'] ?? 'all'))->header('Cache-Control', 'private, no-store');
    }

    public function show(string $id, CustomerHistoryService $history): JsonResponse
    {
        return response()->json(['data' => $history->detail(Auth::guard('customer')->user(), $id)])->header('Cache-Control', 'private, no-store');
    }
}
