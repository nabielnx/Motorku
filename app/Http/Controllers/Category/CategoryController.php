<?php

namespace App\Http\Controllers\Category;

use App\Http\Controllers\Controller;
use App\Services\CategoryService;
use App\Http\Requests\Category\StoreCategoryRequest;
use App\Http\Requests\Category\UpdateCategoryRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Support\Facades\Gate;
use App\Models\Category;

class CategoryController extends Controller implements HasMiddleware
{
    protected $categoryService;

    public function __construct(CategoryService $categoryService)
    {
        $this->categoryService = $categoryService;
    }

    public static function middleware(): array
    {
        return [
            new Middleware('role:owner', only: ['indexWeb', 'store', 'update', 'destroy']),
            new Middleware('permission:category.view', only: ['index', 'show']),
        ];
    }

    public function indexWeb()
    {
        return redirect()->route('products.index');
    }

    public function index(): JsonResponse
    {
        Gate::authorize('viewAny', Category::class);
        
        $categories = $this->categoryService->getAllCategories();
        return response()->json($categories);
    }

    public function store(StoreCategoryRequest $request): JsonResponse
    {
        Gate::authorize('create', Category::class);
        
        $category = $this->categoryService->createCategory($request->validated());

        return response()->json([
            'message' => 'Kategori berhasil ditambahkan!',
            'data' => $category
        ], 201);
    }

    public function show($id): JsonResponse
    {
        $category = $this->categoryService->getCategoryById($id);

        if (!$category) {
            return response()->json(['message' => 'Kategori tidak ditemukan'], 404);
        }

        Gate::authorize('view', $category);

        return response()->json($category);
    }

    public function update(UpdateCategoryRequest $request, $id): JsonResponse
    {
        // 1. Ambil data dulu buat dicek Policy
        $category = $this->categoryService->getCategoryById($id);

        if (!$category) {
            return response()->json(['message' => 'Kategori tidak ditemukan'], 404);
        }

        // 2. Cek Policy (Gate 3)
        Gate::authorize('update', $category);

        // 3. Kalau lolos, baru eksekusi update
        $updatedCategory = $this->categoryService->updateCategory($id, $request->validated());

        return response()->json([
            'message' => 'Kategori berhasil diperbarui!',
            'data' => $updatedCategory
        ]);
    }

    public function destroy($id): JsonResponse
    {
        // 1. Ambil data dulu
        $category = $this->categoryService->getCategoryById($id);

        if (!$category) {
            return response()->json(['message' => 'Kategori tidak ditemukan'], 404);
        }

        // 2. Cek Policy
        Gate::authorize('delete', $category);

        try {
            $this->categoryService->deleteCategory($id);

            return response()->json([
                'message' => 'Kategori berhasil dihapus!'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage()
            ], 422);
        }
    }
}
