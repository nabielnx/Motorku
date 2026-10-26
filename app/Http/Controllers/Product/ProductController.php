<?php

declare(strict_types=1);

namespace App\Http\Controllers\Product;

use App\Http\Controllers\Controller;
use App\Http\Requests\PaginationRequest;
use App\Http\Requests\Product\BulkDeleteProductsRequest;
use App\Http\Requests\Product\PreviewBulkDeleteProductsRequest;
use App\Http\Requests\Product\StoreProductRequest;
use App\Http\Requests\Product\UpdateProductRequest;
use App\Http\Resources\ProductResource;
use App\Models\Category;
use App\Models\Product;
use App\Services\CacheService;
use App\Services\ProductService;
use App\Traits\ApiResponseHelpers;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class ProductController extends Controller implements HasMiddleware
{
    use ApiResponseHelpers;

    public function __construct(
        protected ProductService $productService
    ) {}

    public static function middleware(): array
    {
        return [
            new Middleware('role:owner', only: ['indexWeb', 'createWeb', 'store', 'update', 'destroy', 'previewBulkDelete', 'bulkDestroy']),
            new Middleware('permission:product.view', only: ['index', 'show']),
        ];
    }

    public function indexWeb(Request $request): InertiaResponse|RedirectResponse
    {
        $search = $request->string('search')->value();
        $category = $request->string('category')->value();
        $stockStatus = $request->string('stock_status')->value();
        $availability = $request->string('availability')->value();
        $sort = $request->string('sort')->value();
        $group = $request->string('group')->value();
        $catalogGroups = Category::catalogGroups();
        abort_if($group && ! array_key_exists($group, $catalogGroups), 422, 'Kelompok produk tidak valid.');

        $products = $this->productService->getProductsForWeb($search, $category, $stockStatus, $availability, $sort, $group ?: null, $request->integer('per_page', 16));

        if ($products->currentPage() > $products->lastPage()) {
            return redirect()->route('products.index', $request->except('page'));
        }

        return Inertia::render('Product/Index', [
            'catalogGroups' => $catalogGroups,
            'initialProducts' => $products,
            'initialCategories' => fn () => Category::with(['children' => function ($q) {
                $q->withCount('products');
            }])->whereNull('parent_id')->when($group, fn ($query) => $query->where('catalog_group', $group))->withCount('products')->get(),
            'filters' => [
                'group' => $group ?: '',
                'search' => $search,
                'category' => $category ?: 'All',
                'stock_status' => $stockStatus ?: 'all',
                'availability' => $availability ?: 'all',
                'sort' => $sort ?: 'latest',
            ],
            'lowStockCount' => fn () => Product::inCatalogGroup($group ?: null)->where('stock', '>', 0)->whereColumn('stock', '<=', 'minimum_stock')->count(),
            'outOfStockCount' => fn () => Product::inCatalogGroup($group ?: null)->where('stock', '<=', 0)->count(),
        ]);
    }

    public function createWeb(): RedirectResponse
    {
        return redirect()->route('products.index');
    }

    public function index(PaginationRequest $request): JsonResponse
    {
        Gate::authorize('viewAny', Product::class);

        $perPage = $request->integer('per_page', 10);
        $search = $request->string('search')->value();
        $stockStatus = $request->string('stock_status')->value();

        $products = $this->productService->getAllProducts($perPage, $search !== '' ? $search : null, $stockStatus ?: null);

        $totalProducts = Product::count();
        $lowStock = Product::whereColumn('stock', '<=', 'minimum_stock')->count();

        return $this->successResponse('Berhasil mengambil data produk', [
            'products' => ProductResource::collection($products)->response()->getData(true),
            'summary' => [
                'total_products' => $totalProducts,
                'low_stock' => $lowStock,
            ],
        ]);
    }

    public function store(StoreProductRequest $request): JsonResponse
    {
        Gate::authorize('create', Product::class);

        $product = $this->productService->createProduct($request->validated());
        CacheService::flushMotorcycleParts();

        return $this->successResponse(
            'Produk berhasil ditambahkan!',
            new ProductResource($product),
            201
        );
    }

    public function show($id): JsonResponse
    {
        $product = $this->productService->getProductById($id);

        if (! $product) {
            return $this->errorResponse('Produk tidak ditemukan', 404);
        }

        Gate::authorize('view', $product);

        return $this->successResponse('Detail produk', new ProductResource($product));
    }

    public function update(UpdateProductRequest $request, $id): JsonResponse
    {
        $product = $this->productService->getProductById($id);

        if (! $product) {
            return $this->errorResponse('Produk tidak ditemukan', 404);
        }

        Gate::authorize('update', $product);

        $updatedProduct = $this->productService->updateProduct($id, $request->validated());
        CacheService::flushMotorcycleParts();

        return $this->successResponse(
            'Produk berhasil diperbarui!',
            new ProductResource($updatedProduct)
        );
    }

    public function destroy($id): JsonResponse
    {
        $product = $this->productService->getProductById($id);

        if (! $product) {
            return $this->errorResponse('Produk tidak ditemukan', 404);
        }

        Gate::authorize('delete', $product);

        $this->productService->deleteProduct($id);
        CacheService::flushMotorcycleParts();

        return $this->successResponse('Produk berhasil dihapus!');
    }

    public function previewBulkDelete(PreviewBulkDeleteProductsRequest $request): JsonResponse
    {
        return $this->successResponse('Periksa pilihan produk sebelum menghapus.',
            $this->productService->previewBulkDelete($request->validated(), $request->user()))
            ->header('Cache-Control', 'no-store, private');
    }

    public function bulkDestroy(BulkDeleteProductsRequest $request): JsonResponse
    {
        $count = $this->productService->bulkDelete($request->validated('token'), $request->user());

        return $this->successResponse($count.' produk berhasil dihapus.', ['deleted_count' => $count]);
    }
}
