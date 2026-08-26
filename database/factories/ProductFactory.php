<?php

namespace Database\Factories;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class ProductFactory extends Factory
{
    protected $model = Product::class;

    public function definition(): array
    {
        $name = fake()->randomElement([
            'Ayam Goreng', 'Ayam Bakar', 'Ayam Geprek',
            'Es Teh', 'Es Jeruk', 'Air Mineral',
            'Sambal Bawang', 'Nasi Putih', 'Kerupuk',
        ]) . ' ' . fake()->numberBetween(1, 99);

        return [
            'category_id'  => Category::factory(),
            'name'         => $name,
            'sku'          => strtoupper(Str::random(8)),
            'description'  => fake()->optional()->sentence(),
            'price'        => fake()->randomElement([
                8000, 10000, 15000, 20000, 25000, 30000, 35000
            ]),
            'stock'        => fake()->numberBetween(10, 100),
            'is_available' => true,
        ];
    }

    public function unavailable(): static
    {
        return $this->state(['is_available' => false]);
    }

    public function outOfStock(): static
    {
        return $this->state(['stock' => 0, 'is_available' => false]);
    }
}
