<?php

namespace Tests\Feature\Motorcycle;

use App\Models\Category;
use App\Models\Motorcycle;
use App\Models\MotorcyclePart;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MotorcycleManagementTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private User $cashierUser;
    private Category $category;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\RoleSeeder::class);

        $this->user = User::factory()->create();
        $this->user->assignRole('owner');

        $this->cashierUser = User::factory()->create();
        $this->cashierUser->assignRole('cashier');

        $this->category = Category::factory()->create();
    }

    public function test_can_view_motorcycles_index_page(): void
    {
        Motorcycle::create([
            'brand'       => 'Honda',
            'model'       => 'Vario 160',
            'slug'        => 'honda-vario-160-2022',
            'year_start'  => 2022,
            'engine_cc'   => 160,
            'engine_type' => 'matic',
        ]);

        $response = $this->actingAs($this->user)->get('/motorcycles');
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => 
            $page->component('Motorcycle/Index')
                ->has('motorcycles')
                ->has('products')
                ->has('partCategories')
                ->has('categoryGroups')
        );
    }

    public function test_non_owner_cannot_access_motorcycle_management(): void
    {
        // Cashier attempts to access
        $resIndex = $this->actingAs($this->cashierUser)->get('/motorcycles');
        $resIndex->assertStatus(403);

        $resStore = $this->actingAs($this->cashierUser)->postJson('/motorcycles', [
            'brand'       => 'Honda',
            'model'       => 'Beat',
            'year_start'  => 2023,
            'engine_cc'   => 110,
            'engine_type' => 'matic',
        ]);
        $resStore->assertStatus(403);

        $resBulk = $this->actingAs($this->cashierUser)->postJson('/motorcycles/bulk-attach', [
            'motorcycle_ids' => ['some-uuid'],
            'product_ids'    => ['some-uuid'],
            'part_category'  => 'oli_mesin',
        ]);
        $resBulk->assertStatus(403);
    }

    public function test_can_create_motorcycle_with_validation(): void
    {
        // Validation failure
        $invalidResponse = $this->actingAs($this->user)->postJson('/motorcycles', [
            'brand' => '',
            'model' => '',
        ]);
        $invalidResponse->assertStatus(422)
            ->assertJsonValidationErrors(['brand', 'model', 'year_start', 'engine_cc', 'engine_type']);

        // Success
        $response = $this->actingAs($this->user)->postJson('/motorcycles', [
            'brand'       => 'Yamaha',
            'model'       => 'NMAX 155',
            'year_start'  => 2020,
            'engine_cc'   => 155,
            'engine_type' => 'matic',
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('motorcycles', [
            'brand' => 'Yamaha',
            'model' => 'NMAX 155',
        ]);
    }

    public function test_can_update_motorcycle(): void
    {
        $motor = Motorcycle::create([
            'brand'       => 'Honda',
            'model'       => 'Beat Deluxe',
            'slug'        => 'honda-beat-deluxe-2021',
            'year_start'  => 2021,
            'engine_cc'   => 110,
            'engine_type' => 'matic',
        ]);

        $response = $this->actingAs($this->user)->putJson("/motorcycles/{$motor->id}", [
            'brand'       => 'Honda',
            'model'       => 'Beat Street',
            'year_start'  => 2021,
            'year_end'    => 2024,
            'engine_cc'   => 110,
            'engine_type' => 'matic',
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('motorcycles', [
            'id'    => $motor->id,
            'model' => 'Beat Street',
        ]);
    }

    public function test_can_attach_and_validate_sparepart_mapping(): void
    {
        $motor = Motorcycle::create([
            'brand'       => 'Honda',
            'model'       => 'PCX 160',
            'slug'        => 'honda-pcx-160-2023',
            'year_start'  => 2023,
            'engine_cc'   => 160,
            'engine_type' => 'matic',
        ]);

        $product = Product::factory()->create([
            'name'        => 'Oli MPX2 0.8L',
            'sku'         => 'OLI-MPX2-08',
            'category_id' => $this->category->id,
        ]);

        // Validation failure: invalid category
        $invalidRes = $this->actingAs($this->user)->postJson("/motorcycles/{$motor->id}/parts", [
            'product_id'    => $product->id,
            'part_category' => 'invalid_category_xyz',
        ]);
        $invalidRes->assertStatus(422)
            ->assertJsonValidationErrors(['part_category']);

        // Success attach
        $response = $this->actingAs($this->user)->postJson("/motorcycles/{$motor->id}/parts", [
            'product_id'     => $product->id,
            'part_category'  => 'oli_mesin',
            'notes'          => 'Kapasitas 0.8 Liter',
            'is_recommended' => true,
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('motorcycle_parts', [
            'motorcycle_id'  => $motor->id,
            'product_id'     => $product->id,
            'part_category'  => 'oli_mesin',
            'is_recommended' => true,
        ]);

        // Duplicate attach fails
        $dupRes = $this->actingAs($this->user)->postJson("/motorcycles/{$motor->id}/parts", [
            'product_id'    => $product->id,
            'part_category' => 'oli_mesin',
        ]);
        $dupRes->assertStatus(422);
    }

    public function test_can_bulk_attach_parts_mode_one_motor_to_many_products(): void
    {
        $motor = Motorcycle::create([
            'brand'       => 'Honda',
            'model'       => 'ADV 160',
            'slug'        => 'honda-adv-160-2023',
            'year_start'  => 2023,
            'engine_cc'   => 160,
            'engine_type' => 'matic',
        ]);

        $p1 = Product::factory()->create(['name' => 'Oli Mesin A', 'category_id' => $this->category->id]);
        $p2 = Product::factory()->create(['name' => 'Oli Mesin B', 'category_id' => $this->category->id]);
        $p3 = Product::factory()->create(['name' => 'Oli Mesin C', 'category_id' => $this->category->id]);

        $response = $this->actingAs($this->user)->postJson('/motorcycles/bulk-attach', [
            'motorcycle_ids' => [$motor->id],
            'product_ids'    => [$p1->id, $p2->id, $p3->id],
            'part_category'  => 'oli_mesin',
            'notes'          => 'Bulk batch test',
            'is_recommended' => true,
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'data' => [
                    'attached' => 3,
                    'skipped'  => 0,
                    'total'    => 3,
                ],
            ]);

        $this->assertEquals(3, MotorcyclePart::where('motorcycle_id', $motor->id)->count());

        // Test duplicate skipping: add p2, p3, and a new p4
        $p4 = Product::factory()->create(['name' => 'Oli Mesin D', 'category_id' => $this->category->id]);
        $response2 = $this->actingAs($this->user)->postJson('/motorcycles/bulk-attach', [
            'motorcycle_ids' => [$motor->id],
            'product_ids'    => [$p2->id, $p3->id, $p4->id],
            'part_category'  => 'oli_mesin',
        ]);

        $response2->assertStatus(200)
            ->assertJson([
                'data' => [
                    'attached' => 1,
                    'skipped'  => 2,
                    'total'    => 3,
                ],
            ]);

        $this->assertEquals(4, MotorcyclePart::where('motorcycle_id', $motor->id)->count());
    }

    public function test_can_bulk_attach_parts_mode_one_product_to_many_motors(): void
    {
        $m1 = Motorcycle::create(['brand' => 'Honda', 'model' => 'Beat 2020', 'slug' => 'honda-beat-2020', 'year_start' => 2020, 'engine_cc' => 110, 'engine_type' => 'matic']);
        $m2 = Motorcycle::create(['brand' => 'Honda', 'model' => 'Scoopy 2020', 'slug' => 'honda-scoopy-2020', 'year_start' => 2020, 'engine_cc' => 110, 'engine_type' => 'matic']);
        $m3 = Motorcycle::create(['brand' => 'Honda', 'model' => 'Genio 2020', 'slug' => 'honda-genio-2020', 'year_start' => 2020, 'engine_cc' => 110, 'engine_type' => 'matic']);

        $product = Product::factory()->create(['name' => 'Busi Universal Honda', 'category_id' => $this->category->id]);

        $response = $this->actingAs($this->user)->postJson('/motorcycles/bulk-attach', [
            'motorcycle_ids' => [$m1->id, $m2->id, $m3->id],
            'product_ids'    => [$product->id],
            'part_category'  => 'busi',
            'is_recommended' => true,
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'data' => [
                    'attached' => 3,
                    'skipped'  => 0,
                    'total'    => 3,
                ],
            ]);

        $this->assertEquals(3, MotorcyclePart::where('product_id', $product->id)->count());
    }

    public function test_can_filter_search_and_paginate_motorcycle_parts(): void
    {
        $motor = Motorcycle::create([
            'brand'       => 'Honda',
            'model'       => 'Vario 125',
            'slug'        => 'honda-vario-125-2022',
            'year_start'  => 2022,
            'engine_cc'   => 125,
            'engine_type' => 'matic',
        ]);

        $p1 = Product::factory()->create(['name' => 'Oli SPX2 Matic 0.8L', 'sku' => 'OLI-SPX2', 'category_id' => $this->category->id]);
        $p2 = Product::factory()->create(['name' => 'Busi NGK CPR9EA-9', 'sku' => 'BUSI-NGK', 'category_id' => $this->category->id]);
        $p3 = Product::factory()->create(['name' => 'Kampas Rem Depan Honda', 'sku' => 'REM-DEP-01', 'category_id' => $this->category->id]);
        $p4 = Product::factory()->create(['name' => 'Kampas Rem Belakang', 'sku' => 'REM-BEL-01', 'category_id' => $this->category->id]);
        $p5 = Product::factory()->create(['name' => 'V-Belt Gates Vario', 'sku' => 'VBELT-VAR', 'category_id' => $this->category->id]);
        $p6 = Product::factory()->create(['name' => 'Roller TDR 13gr', 'sku' => 'ROLLER-TDR', 'category_id' => $this->category->id]);

        MotorcyclePart::create(['motorcycle_id' => $motor->id, 'product_id' => $p1->id, 'part_category' => 'oli_mesin', 'is_recommended' => true]);
        MotorcyclePart::create(['motorcycle_id' => $motor->id, 'product_id' => $p2->id, 'part_category' => 'busi', 'is_recommended' => false]);
        MotorcyclePart::create(['motorcycle_id' => $motor->id, 'product_id' => $p3->id, 'part_category' => 'kampas_rem_depan', 'is_recommended' => true]);
        MotorcyclePart::create(['motorcycle_id' => $motor->id, 'product_id' => $p4->id, 'part_category' => 'kampas_rem_belakang', 'is_recommended' => false]);
        MotorcyclePart::create(['motorcycle_id' => $motor->id, 'product_id' => $p5->id, 'part_category' => 'v_belt', 'is_recommended' => true]);
        MotorcyclePart::create(['motorcycle_id' => $motor->id, 'product_id' => $p6->id, 'part_category' => 'roller', 'is_recommended' => false]);

        // 1. Test pagination (per_page = 3)
        $resPage1 = $this->actingAs($this->user)->getJson("/motorcycles/{$motor->id}/parts?per_page=3&page=1");
        $resPage1->assertStatus(200)
            ->assertJson([
                'current_page' => 1,
                'last_page'    => 2,
                'per_page'     => 3,
                'total'        => 6,
                'total_mapped' => 6,
            ]);
        $this->assertCount(3, $resPage1->json('data'));

        // 2. Test search filter
        $resSearch = $this->actingAs($this->user)->getJson("/motorcycles/{$motor->id}/parts?search=NGK");
        $resSearch->assertStatus(200)
            ->assertJson(['total' => 1]);
        $this->assertEquals('Busi NGK CPR9EA-9', $resSearch->json('data.0.product.name'));

        // 3. Test category filter
        $resCat = $this->actingAs($this->user)->getJson("/motorcycles/{$motor->id}/parts?part_category=oli_mesin");
        $resCat->assertStatus(200)
            ->assertJson(['total' => 1]);

        // 4. Test group filter (pengereman)
        $resGroup = $this->actingAs($this->user)->getJson("/motorcycles/{$motor->id}/parts?group=pengereman");
        $resGroup->assertStatus(200)
            ->assertJson(['total' => 2]);

        // 5. Test recommendation filter
        $resRec = $this->actingAs($this->user)->getJson("/motorcycles/{$motor->id}/parts?is_recommended=1");
        $resRec->assertStatus(200)
            ->assertJson(['total' => 3]);
    }

    public function test_can_update_and_detach_motorcycle_part(): void
    {
        $motor = Motorcycle::create([
            'brand'       => 'Suzuki',
            'model'       => 'Satria F150',
            'slug'        => 'suzuki-satria-f150-2018',
            'year_start'  => 2018,
            'engine_cc'   => 150,
            'engine_type' => 'sport',
        ]);

        $product = Product::factory()->create(['name' => 'Busi Denso Iridium', 'sku' => 'BUSI-DENSO', 'category_id' => $this->category->id]);
        $part = MotorcyclePart::create([
            'motorcycle_id'  => $motor->id,
            'product_id'     => $product->id,
            'part_category'  => 'busi',
            'notes'          => 'Catatan awal',
            'is_recommended' => false,
        ]);

        // Update mapping
        $updateRes = $this->actingAs($this->user)->putJson("/motorcycles/{$motor->id}/parts/{$part->id}", [
            'notes'          => 'Catatan baru rekomendasi',
            'is_recommended' => true,
        ]);
        $updateRes->assertStatus(200);
        $this->assertDatabaseHas('motorcycle_parts', [
            'id'             => $part->id,
            'notes'          => 'Catatan baru rekomendasi',
            'is_recommended' => true,
        ]);

        // Detach mapping
        $deleteRes = $this->actingAs($this->user)->deleteJson("/motorcycles/{$motor->id}/parts/{$part->id}");
        $deleteRes->assertStatus(200);
        $this->assertSoftDeleted('motorcycle_parts', ['id' => $part->id]);
    }
}
