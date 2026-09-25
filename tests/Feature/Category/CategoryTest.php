<?php

namespace Tests\Feature\Category;

use App\Models\Category;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CategoryTest extends TestCase
{
    use RefreshDatabase;

    private User $owner;
    private User $cashier;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\RoleSeeder::class);

        $this->owner = User::factory()->create();
        $this->owner->assignRole('owner');

        $this->cashier = User::factory()->create();
        $this->cashier->assignRole('cashier');
    }

    public function test_owner_can_list_categories(): void
    {
        Category::factory()->count(2)->create();

        $response = $this->actingAs($this->owner)->getJson('/api/categories');

        $response->assertStatus(200);
    }

    public function test_cashier_cannot_list_categories(): void
    {
        $this->actingAs($this->cashier)
            ->getJson('/api/categories')
            ->assertStatus(403);
    }

    public function test_owner_can_create_category(): void
    {
        $response = $this->actingAs($this->owner)->postJson('/api/categories', [
            'name' => 'Minuman Spesial',
            'description' => 'Berbagai es teh dan jus segar',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('message', 'Kategori berhasil ditambahkan!');

        $this->assertDatabaseHas('categories', ['name' => 'Minuman Spesial']);
    }

    public function test_created_subcategory_keeps_its_parent(): void
    {
        $this->actingAs($this->owner)->postJson('/api/categories', [
            'name' => 'Oli, Pelumas & Kimia',
            'sub_categories' => [['name' => 'Oli Mesin (4T)']],
        ])->assertCreated();

        $parentId = Category::where('name', 'Oli, Pelumas & Kimia')->value('id');
        $this->assertDatabaseHas('categories', [
            'name' => 'Oli Mesin (4T)',
            'parent_id' => $parentId,
        ]);
    }

    public function test_owner_can_update_category(): void
    {
        $category = Category::factory()->create(['name' => 'Kategori Lama']);

        $response = $this->actingAs($this->owner)->putJson("/api/categories/{$category->id}", [
            'name' => 'Kategori Baru',
            'description' => 'Deskripsi baru',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('message', 'Kategori berhasil diperbarui!');

        $this->assertDatabaseHas('categories', [
            'id' => $category->id,
            'name' => 'Kategori Baru',
        ]);
    }

    public function test_owner_can_delete_category(): void
    {
        $category = Category::factory()->create();

        $response = $this->actingAs($this->owner)->deleteJson("/api/categories/{$category->id}");

        $response->assertStatus(200)
            ->assertJsonPath('message', 'Kategori berhasil dihapus!');

        $this->assertSoftDeleted('categories', ['id' => $category->id]);
    }
}
