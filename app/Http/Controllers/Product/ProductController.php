<?php

declare(strict_types=1);

namespace App\Http\Controllers\Product;

use App\Http\Controllers\Controller;
use App\Services\ProductService;
use App\Http\Requests\Product\StoreProductRequest;
use App\Http\Requests\Product\UpdateProductRequest;
use App\Http\Resources\ProductResource;
use App\Traits\ApiResponseHelpers;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Support\Facades\Gate;
use App\Models\Product;
use App\Models\Category;
use App\Services\CacheService;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use Illuminate\Http\RedirectResponse;

class ProductController extends Controller implements HasMiddleware
{
    use ApiResponseHelpers;

    public function __construct(
        protected ProductService $productService
    ) {}

    public static function middleware(): array
    {
        return [
            new Middleware('role:owner', only: ['indexWeb', 'createWeb', 'store', 'update', 'destroy']),
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

        $products = $this->productService->getProductsForWeb($search, $category, $stockStatus, $availability, $sort);

        if ($products->currentPage() > $products->lastPage()) {
            return redirect()->route('products.index', $request->except('page'));
        }

        $lowStockCount = Product::where('stock', '>', 0)->whereColumn('stock', '<=', 'minimum_stock')->count();
        $outOfStockCount = Product::where('stock', '<=', 0)->count();

        return Inertia::render('Product/Index', [
            'initialProducts' => $products,
            'initialCategories' => Category::with(['children' => function ($q) {
                $q->withCount('products');
            }])->whereNull('parent_id')->withCount('products')->get(),
            'filters' => [
                'search' => $search ?: '',
                'category' => $category ?: 'All',
                'stock_status' => $stockStatus ?: 'all',
                'availability' => $availability ?: 'all',
                'sort' => $sort ?: 'latest',
            ],
            'lowStockCount' => $lowStockCount,
            'outOfStockCount' => $outOfStockCount,
        ]);
    }

    public function createWeb(): RedirectResponse
    {
        return redirect()->route('products.index');
    }

    public function index(Request $request): JsonResponse
    {
        Gate::authorize('viewAny', Product::class);

        $perPage = $request->integer('per_page', 10);
        $search = $request->string('search')->value();
        $stockStatus = $request->string('stock_status')->value();

        $products = $this->productService->getAllProducts($perPage, $search ?: null, $stockStatus ?: null);

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

        CacheService::flushCatalog();

        return $this->successResponse(
            'Produk berhasil ditambahkan!',
            new ProductResource($product),
            201
        );
    }

    public function show($id): JsonResponse
    {
        $product = $this->productService->getProductById($id);

        if (!$product) {
            return $this->errorResponse('Produk tidak ditemukan', 404);
        }

        Gate::authorize('view', $product);

        return $this->successResponse('Detail produk', new ProductResource($product));
    }

    public function update(UpdateProductRequest $request, $id): JsonResponse
    {
        $product = $this->productService->getProductById($id);

        if (!$product) {
            return $this->errorResponse('Produk tidak ditemukan', 404);
        }

        Gate::authorize('update', $product);

        $updatedProduct = $this->productService->updateProduct($id, $request->validated());

        CacheService::flushCatalog();

        return $this->successResponse(
            'Produk berhasil diperbarui!',
            new ProductResource($updatedProduct)
        );
    }

    public function destroy($id): JsonResponse
    {
        $product = $this->productService->getProductById($id);

        if (!$product) {
            return $this->errorResponse('Produk tidak ditemukan', 404);
        }

        Gate::authorize('delete', $product);

        $this->productService->deleteProduct($id);

        CacheService::flushCatalog();

        return $this->successResponse('Produk berhasil dihapus!');
    }
}
