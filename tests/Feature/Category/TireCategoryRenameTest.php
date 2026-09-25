<?php

namespace Tests\Feature\Category;

use App\Models\Category;
use App\Models\Product;
use Database\Seeders\CategorySeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TireCategoryRenameTest extends TestCase
{
    use RefreshDatabase;

    public function test_renaming_tube_type_category_keeps_existing_products_linked(): void
    {
        $category = Category::factory()->create(['name' => 'Ban Luar Biasa / Tube Type']);
        $product = Product::factory()->create(['category_id' => $category->id]);

        $migration = require database_path('migrations/2026_09_26_000001_rename_tube_type_tire_category.php');
        $migration->up();
        $this->seed(CategorySeeder::class);

        $this->assertDatabaseHas('categories', [
            'id' => $category->id,
            'name' => 'Ban Luar (Pakai Ban Dalam)',
        ]);
        $this->assertDatabaseMissing('categories', ['name' => 'Ban Luar Biasa / Tube Type']);
        $this->assertSame($category->id, $product->fresh()->category_id);
    }
}
