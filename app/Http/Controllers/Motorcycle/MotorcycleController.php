<?php

namespace App\Http\Controllers\Motorcycle;

use App\Http\Controllers\Controller;
use App\Http\Requests\Motorcycle\AttachMotorcyclePartRequest;
use App\Http\Requests\Motorcycle\BulkAttachMotorcyclePartsRequest;
use App\Http\Requests\Motorcycle\GetMotorcyclePartsRequest;
use App\Http\Requests\Motorcycle\StoreMotorcycleRequest;
use App\Http\Requests\Motorcycle\UpdateMotorcyclePartRequest;
use App\Http\Requests\Motorcycle\UpdateMotorcycleRequest;
use App\Services\MotorcycleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Inertia\Inertia;
use Inertia\Response;

class MotorcycleController extends Controller implements HasMiddleware
{
    protected MotorcycleService $motorcycleService;

    public function __construct(MotorcycleService $motorcycleService)
    {
        $this->motorcycleService = $motorcycleService;
    }

    public static function middleware(): array
    {
        return [
            new Middleware('role:owner'),
        ];
    }

    /**
     * Admin page — manage motorcycles & part mappings.
     */
    public function indexWeb(): Response
    {
        $motorcycles    = $this->motorcycleService->getAllMotorcycles();
        $products       = $this->motorcycleService->getAvailableProducts();
        $partCategories = $this->motorcycleService->getPartCategories();
        $categoryGroups = $this->motorcycleService->getCategoryGroups();

        return Inertia::render('Motorcycle/Index', [
            'motorcycles'    => $motorcycles,
            'products'       => $products,
            'partCategories' => $partCategories,
            'categoryGroups' => $categoryGroups,
        ]);
    }

    /**
     * API: Store a new motorcycle.
     */
    public function store(StoreMotorcycleRequest $request): JsonResponse
    {
        $data = $request->validated();

        if ($request->hasFile('image')) {
            $data['image'] = $request->file('image');
        }

        $motorcycle = $this->motorcycleService->createMotorcycle($data);

        return response()->json([
            'message' => 'Motor berhasil ditambahkan.',
            'data'    => $motorcycle,
        ], 201);
    }

    /**
     * API: Update motorcycle.
     */
    public function update(UpdateMotorcycleRequest $request, string $id): JsonResponse
    {
        $data = $request->validated();

        if ($request->hasFile('image')) {
            $data['image'] = $request->file('image');
        }

        $motorcycle = $this->motorcycleService->updateMotorcycle($id, $data);

        return response()->json([
            'message' => 'Motor berhasil diperbarui.',
            'data'    => $motorcycle,
        ]);
    }

    /**
     * API: Delete motorcycle.
     */
    public function destroy(string $id): JsonResponse
    {
        $this->motorcycleService->deleteMotorcycle($id);

        return response()->json(['message' => 'Motor berhasil dihapus.']);
    }

    /**
     * API: Get parts mapped to a motorcycle with filtering, search, and pagination.
     */
    public function parts(GetMotorcyclePartsRequest $request, string $id): JsonResponse
    {
        $result = $this->motorcycleService->getMotorcycleParts($id, $request->validated());

        return response()->json($result);
    }

    /**
     * API: Attach a product to a motorcycle.
     */
    public function attachPart(AttachMotorcyclePartRequest $request, string $id): JsonResponse
    {
        try {
            $part = $this->motorcycleService->attachPart($id, $request->validated());

            return response()->json([
                'message' => 'Part berhasil di-mapping.',
                'data'    => $part,
            ], 201);
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'message' => $e->getMessage(),
                'errors'  => ['product_id' => [$e->getMessage()]],
            ], 422);
        }
    }

    /**
     * API: Bulk attach spareparts to motorcycles.
     */
    public function bulkAttach(BulkAttachMotorcyclePartsRequest $request): JsonResponse
    {
        $result = $this->motorcycleService->bulkAttachParts($request->validated());

        $msg = "Bulk mapping selesai. {$result['attached']} sparepart berhasil di-mapping.";
        if ($result['skipped'] > 0) {
            $msg .= " ({$result['skipped']} dilewati karena sudah ada).";
        }

        return response()->json([
            'message' => $msg,
            'data'    => $result,
        ], 200);
    }

    /**
     * API: Update a part mapping (notes, is_recommended, part_category).
     */
    public function updatePart(UpdateMotorcyclePartRequest $request, string $motorcycleId, string $partId): JsonResponse
    {
        $part = $this->motorcycleService->updatePart($motorcycleId, $partId, $request->validated());

        return response()->json([
            'message' => 'Mapping part berhasil diperbarui.',
            'data'    => $part,
        ]);
    }

    /**
     * API: Detach a part from motorcycle.
     */
    public function detachPart(string $motorcycleId, string $partId): JsonResponse
    {
        $this->motorcycleService->detachPart($motorcycleId, $partId);

        return response()->json(['message' => 'Part berhasil dihapus dari motor.']);
    }
}
