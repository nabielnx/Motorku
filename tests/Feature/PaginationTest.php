<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class PaginationTest extends TestCase
{
    use RefreshDatabase;

    private User $owner;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\RoleSeeder::class);

        $this->owner = User::factory()->create();
        $this->owner->assignRole('owner');
    }

    #[Test]
    public function dashboard_recent_orders_api_returns_length_aware_paginator(): void
    {
        Order::factory()->count(12)->create();

        $response = $this->actingAs($this->owner)
            ->getJson('/api/dashboard/recent-orders?page=2&per_page=5');

        $response->assertOk()
            ->assertJsonPath('current_page', 2)
            ->assertJsonPath('per_page', 5)
            ->assertJsonPath('total', 12)
            ->assertJsonCount(5, 'data');
    }

    #[Test]
    public function orders_web_index_returns_paginated_inertia_prop(): void
    {
        Order::factory()->count(15)->create();

        $response = $this->actingAs($this->owner)
            ->get('/orders?page=2');

        $response->assertOk();
        $initialOrders = $response->viewData('page')['props']['initialOrders'];

        $this->assertEquals(2, $initialOrders['current_page']);
        $this->assertEquals(10, $initialOrders['per_page']);
        $this->assertEquals(15, $initialOrders['total']);
        $this->assertCount(5, $initialOrders['data']);
    }

    #[Test]
    public function orders_web_index_returns_consistent_summary_across_pages(): void
    {
        Order::factory()->count(12)->create([
            'created_at' => now(),
            'order_status' => 'pending',
            'payment_status' => 'unpaid',
        ]);

        // Page 1
        $r1 = $this->actingAs($this->owner)->get('/orders?page=1');
        $summaryPage1 = $r1->viewData('page')['props']['summary'];
        $this->assertEquals(12, $summaryPage1['today_order_count']);
        $this->assertEquals(12, $summaryPage1['pending_count']);

        // Page 2
        $r2 = $this->actingAs($this->owner)->get('/orders?page=2');
        $summaryPage2 = $r2->viewData('page')['props']['summary'];
        $this->assertEquals(12, $summaryPage2['today_order_count']);
        $this->assertEquals(12, $summaryPage2['pending_count']);
    }

    #[Test]
    public function products_web_index_returns_paginated_inertia_prop(): void
    {
        $category = \App\Models\Category::factory()->create();
        Product::factory()->count(14)->create(['category_id' => $category->id]);

        $response = $this->actingAs($this->owner)
            ->get('/products?page=2');

        $response->assertOk();
        $initialProducts = $response->viewData('page')['props']['initialProducts'];

        $this->assertEquals(2, $initialProducts['current_page']);
        $this->assertEquals(10, $initialProducts['per_page']);
        $this->assertEquals(14, $initialProducts['total']);
        $this->assertCount(4, $initialProducts['data']);
    }

    #[Test]
    public function users_web_index_returns_paginated_inertia_prop(): void
    {
        User::factory()->count(11)->create();

        $response = $this->actingAs($this->owner)
            ->get('/users?page=2');

        $response->assertOk();
        $initialUsers = $response->viewData('page')['props']['initialUsers'];

        $this->assertEquals(2, $initialUsers['current_page']);
        $this->assertEquals(10, $initialUsers['per_page']);
        // +1 owner created in setUp = 12 total users
        $this->assertEquals(12, $initialUsers['total']);
        $this->assertCount(2, $initialUsers['data']);
    }

}
