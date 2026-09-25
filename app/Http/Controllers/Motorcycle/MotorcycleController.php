<?php

declare(strict_types=1);

namespace App\Http\Controllers\Motorcycle;

use App\Http\Controllers\Controller;
use App\Http\Requests\Motorcycle\AttachMotorcyclePartRequest;
use App\Http\Requests\Motorcycle\BulkAttachMotorcyclePartsRequest;
use App\Http\Requests\Motorcycle\GetMotorcyclePartsRequest;
use App\Http\Requests\Motorcycle\StoreMotorcycleRequest;
use App\Http\Requests\Motorcycle\UpdateMotorcyclePartRequest;
use App\Http\Requests\Motorcycle\UpdateMotorcycleRequest;
use App\Http\Resources\MotorcycleResource;
use App\Services\CacheService;
use App\Services\MotorcycleService;
use App\Traits\ApiResponseHelpers;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Inertia\Inertia;
use Inertia\Response;

class MotorcycleController extends Controller implements HasMiddleware
{
    use ApiResponseHelpers;

    public function __construct(
        protected MotorcycleService $motorcycleService
    ) {}

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

        CacheService::flushMotorcycles();

        return $this->successResponse(
            'Motor berhasil ditambahkan.',
            new MotorcycleResource($motorcycle),
            201
        );
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

        CacheService::flushMotorcycles();

        return $this->successResponse(
            'Motor berhasil diperbarui.',
            new MotorcycleResource($motorcycle)
        );
    }

    /**
     * API: Delete motorcycle.
     */
    public function destroy(string $id): JsonResponse
    {
        $this->motorcycleService->deleteMotorcycle($id);

        CacheService::flushMotorcycles();

        return $this->successResponse('Motor berhasil dihapus.');
    }

    /**
     * API: Get parts mapped to a motorcycle with filtering, search, and pagination.
     */
    public function parts(GetMotorcyclePartsRequest $request, string $id): JsonResponse
    {
        $result = $this->motorcycleService->getMotorcycleParts($id, $request->validated());

        return $this->successResponse('Data sparepart motor berhasil dimuat', $result);
    }

    /**
     * API: Attach a product to a motorcycle.
     */
    public function attachPart(AttachMotorcyclePartRequest $request, string $id): JsonResponse
    {
        try {
            $part = $this->motorcycleService->attachPart($id, $request->validated());

            CacheService::flushMotorcycles();
            CacheService::flushCatalog();

            return $this->successResponse(
                'Part berhasil di-mapping.',
                $part,
                201
            );
        } catch (\InvalidArgumentException $e) {
            return $this->errorResponse($e->getMessage(), 422, ['product_id' => [$e->getMessage()]]);
        }
    }

    /**
     * API: Bulk attach spareparts to motorcycles.
     */
    public function bulkAttach(BulkAttachMotorcyclePartsRequest $request): JsonResponse
    {
        $result = $this->motorcycleService->bulkAttachParts($request->validated());

        CacheService::flushMotorcycles();
        CacheService::flushCatalog();

        $msg = "Bulk mapping selesai. {$result['attached']} sparepart berhasil di-mapping.";
        if ($result['skipped'] > 0) {
            $msg .= " ({$result['skipped']} dilewati karena sudah ada).";
        }

        return $this->successResponse($msg, $result);
    }

    /**
     * API: Update a part mapping (notes, is_recommended, part_category).
     */
    public function updatePart(UpdateMotorcyclePartRequest $request, string $motorcycleId, string $partId): JsonResponse
    {
        $part = $this->motorcycleService->updatePart($motorcycleId, $partId, $request->validated());

        CacheService::flushMotorcycles();
        CacheService::flushCatalog();

        return $this->successResponse('Mapping part berhasil diperbarui.', $part);
    }

    /**
     * API: Detach a part from motorcycle.
     */
    public function detachPart(string $motorcycleId, string $partId): JsonResponse
    {
        $this->motorcycleService->detachPart($motorcycleId, $partId);

        CacheService::flushMotorcycles();
        CacheService::flushCatalog();

        return $this->successResponse('Part berhasil dihapus dari motor.');
    }
}
