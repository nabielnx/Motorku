<?php

namespace Database\Factories;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

class OrderItemFactory extends Factory
{
    protected $model = OrderItem::class;

    public function definition(): array
    {
        $unitPrice = fake()->randomElement([10000, 15000, 25000, 30000]);
        $quantity  = fake()->numberBetween(1, 3);

        return [
            'order_id'        => Order::factory(),
            'product_id'      => Product::factory(),
            'product_name'    => fake()->words(3, true),
            'product_sku'     => strtoupper(fake()->bothify('??####')),
            'unit_price'      => $unitPrice,
            'discount_amount' => 0,
            'quantity'        => $quantity,
            'subtotal'        => $unitPrice * $quantity,
            'notes'           => fake()->optional(0.2)->randomElement([
                'Pedas', 'Tanpa sambal', 'Extra nasi'
            ]),
        ];
    }
}
