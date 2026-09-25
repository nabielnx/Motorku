<?php

declare(strict_types=1);

namespace App\Http\Controllers\Category;

use App\Http\Controllers\Controller;
use App\Services\CategoryService;
use App\Http\Requests\Category\StoreCategoryRequest;
use App\Http\Requests\Category\UpdateCategoryRequest;
use App\Http\Resources\CategoryResource;
use App\Traits\ApiResponseHelpers;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Support\Facades\Gate;
use App\Models\Category;
use Illuminate\Http\RedirectResponse;

class CategoryController extends Controller implements HasMiddleware
{
    use ApiResponseHelpers;

    public function __construct(
        protected CategoryService $categoryService
    ) {}

    public static function middleware(): array
    {
        return [
            new Middleware('role:owner', only: ['indexWeb', 'store', 'update', 'destroy']),
            new Middleware('permission:category.view', only: ['index', 'show']),
        ];
    }

    public function indexWeb(): RedirectResponse
    {
        return redirect()->route('products.index');
    }

    public function index(): JsonResponse
    {
        Gate::authorize('viewAny', Category::class);
        
        $categories = $this->categoryService->getAllCategories();

        return $this->successResponse(
            'Daftar Kategori',
            CategoryResource::collection($categories)
        );
    }

    public function store(StoreCategoryRequest $request): JsonResponse
    {
        Gate::authorize('create', Category::class);
        
        $category = $this->categoryService->createCategory($request->validated());

        return $this->successResponse(
            'Kategori berhasil ditambahkan!',
            new CategoryResource($category),
            201
        );
    }

    public function show($id): JsonResponse
    {
        $category = $this->categoryService->getCategoryById($id);

        if (!$category) {
            return $this->errorResponse('Kategori tidak ditemukan', 404);
        }

        Gate::authorize('view', $category);

        return $this->successResponse('Detail Kategori', new CategoryResource($category));
    }

    public function update(UpdateCategoryRequest $request, $id): JsonResponse
    {
        $category = $this->categoryService->getCategoryById($id);

        if (!$category) {
            return $this->errorResponse('Kategori tidak ditemukan', 404);
        }

        Gate::authorize('update', $category);

        $updatedCategory = $this->categoryService->updateCategory($id, $request->validated());

        return $this->successResponse(
            'Kategori berhasil diperbarui!',
            new CategoryResource($updatedCategory)
        );
    }

    public function destroy($id): JsonResponse
    {
        $category = $this->categoryService->getCategoryById($id);

        if (!$category) {
            return $this->errorResponse('Kategori tidak ditemukan', 404);
        }

        Gate::authorize('delete', $category);

        try {
            $this->categoryService->deleteCategory($id);
            return $this->successResponse('Kategori berhasil dihapus!');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }
    }
}
