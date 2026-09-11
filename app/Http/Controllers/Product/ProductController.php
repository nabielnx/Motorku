<?php

namespace App\Http\Controllers\Product;

use App\Http\Controllers\Controller;
use App\Services\ProductService;
use App\Http\Requests\Product\StoreProductRequest;
use App\Http\Requests\Product\UpdateProductRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Support\Facades\Gate;
use App\Models\Product;

class ProductController extends Controller implements HasMiddleware
{
    protected $productService;

    public function __construct(ProductService $productService)
    {
        $this->productService = $productService;
    }

    public static function middleware(): array
    {
        return [
            new Middleware('role:owner', only: ['indexWeb', 'createWeb', 'store', 'update', 'destroy']),
            new Middleware('permission:product.view', only: ['index', 'show']),
        ];
    }

    public function indexWeb(\Illuminate\Http\Request $request)
    {
        $search = $request->string('search')->value();
        $category = $request->string('category')->value();
        $stockStatus = $request->string('stock_status')->value();

        $query = Product::with('category')->latest();

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('sku', 'like', "%{$search}%");
            });
        }

        if ($category && $category !== 'All') {
            $query->whereHas('category', function ($q) use ($category) {
                $q->where('name', $category);
            });
        }

        if ($stockStatus && $stockStatus !== 'all') {
            if ($stockStatus === 'low') {
                $query->whereColumn('stock', '<=', 'minimum_stock');
            } elseif ($stockStatus === 'out') {
                $query->where('stock', '<=', 0);
            } elseif ($stockStatus === 'normal') {
                $query->whereColumn('stock', '>', 'minimum_stock');
            }
        }

        $products = $query->paginate(10)->withQueryString();
        $lowStockCount = Product::whereColumn('stock', '<=', 'minimum_stock')->count();
        $outOfStockCount = Product::where('stock', '<=', 0)->count();

        return \Inertia\Inertia::render('Product/Index', [
            'initialProducts' => $products,
            'initialCategories' => \App\Models\Category::withCount('products')->get(),
            'filters' => [
                'search' => $search ?: '',
                'category' => $category ?: 'All',
                'stock_status' => $stockStatus ?: 'all',
            ],
            'lowStockCount' => $lowStockCount,
            'outOfStockCount' => $outOfStockCount,
        ]);
    }

    public function createWeb()
    {
        return redirect()->route('products.index');
    }

    public function index(Request $request): JsonResponse
    {
        Gate::authorize('viewAny', Product::class);
        
        $perPage = $request->integer('per_page', 10);
        $search = $request->string('search');
        $stockStatus = $request->string('stock_status');
        $products = $this->productService->getAllProducts($perPage, $search ?: null, $stockStatus ?: null);

        $totalProducts = Product::count();
        $lowStock = Product::whereColumn('stock', '<=', 'minimum_stock')->count();

        return response()->json([
            'products' => $products,
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

        return response()->json([
            'message' => 'Produk berhasil ditambahkan!',
            'data' => $product
        ], 201);
    }

    public function show($id): JsonResponse
    {
        $product = $this->productService->getProductById($id);

        if (!$product) {
            return response()->json(['message' => 'Produk tidak ditemukan'], 404);
        }

        Gate::authorize('view', $product);

        return response()->json($product);
    }

    public function update(UpdateProductRequest $request, $id): JsonResponse
    {
        // 1. Ambil data dulu
        $product = $this->productService->getProductById($id);

        if (!$product) {
            return response()->json(['message' => 'Produk tidak ditemukan'], 404);
        }

        // 2. Cek Policy
        Gate::authorize('update', $product);

        // 3. Eksekusi
        $updatedProduct = $this->productService->updateProduct($id, $request->validated());

        return response()->json([
            'message' => 'Produk berhasil diperbarui!',
            'data' => $updatedProduct
        ]);
    }

    public function destroy($id): JsonResponse
    {
        // 1. Ambil data dulu
        $product = $this->productService->getProductById($id);

        if (!$product) {
            return response()->json(['message' => 'Produk tidak ditemukan'], 404);
        }

        // 2. Cek Policy
        Gate::authorize('delete', $product);

        // 3. Eksekusi
        $this->productService->deleteProduct($id);

        return response()->json([
            'message' => 'Produk berhasil dihapus!'
        ]);
    }
}
