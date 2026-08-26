<?php

namespace Database\Factories;

use App\Models\Category;
use Illuminate\Database\Eloquent\Factories\Factory;

class CategoryFactory extends Factory
{
    protected $model = Category::class;

    public function definition(): array
    {
        return [
            'name'        => fake()->unique()->randomElement([
                'Ayam', 'Minuman', 'Sambal', 'Snack',
                'Nasi', 'Paket', 'Dessert', 'Lainnya',
            ]),
            'description' => fake()->optional()->sentence(),
        ];
    }
}
