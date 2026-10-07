<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminNavigationTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_and_cashier_can_open_pos(): void
    {
        $this->seed(RoleSeeder::class);
        Product::factory()->create(['is_available' => true]);
        foreach (['owner', 'cashier'] as $role) {
            $user = User::factory()->create();
            $user->assignRole($role);
            $this->actingAs($user)->get('/pos')->assertOk()->assertInertia(fn ($page) => $page
                ->component('POS/Index')->where('auth.roles.0', $role)->has('initialProducts', 1));
        }
    }

    public function test_catalog_navigation_respects_the_first_request_page_size(): void
    {
        $this->seed(RoleSeeder::class);
        $owner = User::factory()->create();
        $owner->assignRole('owner');
        $this->actingAs($owner);
        foreach (['', 'automotive', 'electronics', 'hardware', 'bicycle'] as $group) {
            foreach ([18, 20] as $size) {
                $this->get('/products?'.http_build_query(['group' => $group, 'per_page' => $size]))
                    ->assertOk()->assertInertia(fn ($page) => $page->component('Product/Index')
                    ->where('filters.group', $group)->where('initialProducts.per_page', $size));
            }
        }
    }
}
