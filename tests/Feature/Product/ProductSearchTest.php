<?php

namespace Tests\Feature\Product;

use App\Models\Category;
use App\Models\Motorcycle;
use App\Models\Product;
use App\Models\User;
use App\Services\ProductService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

class ProductSearchTest extends TestCase
{
    use RefreshDatabase;

    private User $owner;
    private User $cashier;
    private Category $category;
    private ProductService $productService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\RoleSeeder::class);

        $this->owner = User::factory()->create();
        $this->owner->assignRole('owner');

        $this->cashier = User::factory()->create();
        $this->cashier->assignRole('cashier');

        $this->category = Category::factory()->create(['name' => 'Oli Mesin']);
        $this->productService = app(ProductService::class);
    }

    public function test_space_tolerant_search_finds_product_without_spaces(): void
    {
        $mpx2 = Product::factory()->create([
            'name' => 'Honda AHM AHM MPX 2 (0.8 L)',
            'sku' => 'OIL-AHM-MPX2',
            'category_id' => $this->category->id,
            'is_available' => true,
        ]);

        $vbelt = Product::factory()->create([
            'name' => 'V-Belt Racing Beat ESP',
            'sku' => 'BELT-ESP-01',
            'category_id' => $this->category->id,
            'is_available' => true,
        ]);

        // 1. Search 'mpx2' without space -> matches 'Honda AHM AHM MPX 2'
        $results = $this->productService->getAllProducts(null, 'mpx2');
        $this->assertTrue($results->contains('id', $mpx2->id));
        $this->assertFalse($results->contains('id', $vbelt->id));

        // 2. Search 'vbelt' without hyphen -> matches 'V-Belt'
        $resultsBelt = $this->productService->getAllProducts(null, 'vbelt');
        $this->assertTrue($resultsBelt->contains('id', $vbelt->id));
        $this->assertFalse($resultsBelt->contains('id', $mpx2->id));
    }

    public function test_pos_receives_motorcycle_fitment_for_product_search(): void
    {
        $product = Product::factory()->create(['category_id' => $this->category->id, 'is_available' => true]);
        $motorcycle = Motorcycle::create([
            'brand' => 'Honda', 'model' => 'Vario 125', 'slug' => 'honda-vario-125-test',
            'year_start' => 2020, 'engine_cc' => 125, 'engine_type' => 'matic',
        ]);
        DB::table('motorcycle_parts')->insert([
            'id' => (string) Str::uuid(), 'product_id' => $product->id,
            'motorcycle_id' => $motorcycle->id, 'part_category' => 'oli',
            'created_at' => now(), 'updated_at' => now(),
        ]);

        $this->actingAs($this->cashier)->get('/pos')->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('POS/Index')
                ->where('initialProducts.0.motorcycles.0.model', 'Vario 125'));
    }

    public function test_multi_token_search_finds_product(): void
    {
        $mpx2 = Product::factory()->create([
            'name' => 'Honda AHM AHM MPX 2 (0.8 L)',
            'sku' => 'OIL-AHM-MPX2',
            'category_id' => $this->category->id,
            'is_available' => true,
        ]);

        $results = $this->productService->getProductsForWeb('ahm mpx2');
        $this->assertTrue(collect($results->items())->contains('id', $mpx2->id));
    }

    public function test_api_products_supports_fuzzy_space_tolerant_search(): void
    {
        $product = Product::factory()->create([
            'name' => 'Honda AHM AHM MPX 2 (0.8 L)',
            'sku' => 'OIL-AHM-MPX2',
            'category_id' => $this->category->id,
            'is_available' => true,
        ]);

        $response = $this->actingAs($this->cashier)->getJson('/api/products?search=mpx2');

        $response->assertOk();
        $response->assertJsonFragment(['name' => 'Honda AHM AHM MPX 2 (0.8 L)']);
    }
}
