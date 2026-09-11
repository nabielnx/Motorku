<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Services\InventoryService;
use App\Http\Requests\Inventory\StoreInventoryRequest;
use App\Http\Requests\Inventory\UpdateInventoryRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

class InventoryController extends Controller implements HasMiddleware
{
    protected $inventoryService;

    public function __construct(InventoryService $inventoryService)
    {
        $this->inventoryService = $inventoryService;
    }

    public static function middleware(): array
    {
        return [
            new Middleware('role:owner', only: ['index', 'indexWeb', 'show', 'store', 'update', 'destroy']),
        ];
    }

    public function indexWeb()
    {
        return redirect()->route('products.index');
    }

    public function index(Request $request): JsonResponse
    {
        $perPage = $request->integer('per_page', 15);
        $logs = $this->inventoryService->getAllLogs($perPage);
        return response()->json($logs);
    }

    public function store(StoreInventoryRequest $request): JsonResponse
    {
        $log = $this->inventoryService->adjustStock($request->validated());

        return response()->json([
            'message' => 'Penyesuaian stok berhasil dicatat!',
            'data' => $log
        ], 201);
    }

    public function show($id): JsonResponse
    {
        $log = $this->inventoryService->getLogById($id);

        if (!$log) {
            return response()->json(['message' => 'Data tidak ditemukan'], 404);
        }

        return response()->json($log);
    }

    public function update(UpdateInventoryRequest $request, $id): JsonResponse
    {
        $log = $this->inventoryService->getLogById($id);

        if (!$log) {
            return response()->json(['message' => 'Data tidak ditemukan'], 404);
        }

        $updated = $this->inventoryService->updateLog($id, $request->validated());

        return response()->json([
            'message' => 'Data berhasil diperbarui!',
            'data' => $updated
        ]);
    }

    public function destroy($id): JsonResponse
    {
        return response()->json([
            'message' => 'Log inventori tidak dapat dihapus. Buat entri koreksi baru untuk memperbaiki stok.'
        ], 403);
    }
}
