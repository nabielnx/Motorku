<?php

namespace Database\Factories;

use App\Models\Order;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class OrderFactory extends Factory
{
    protected $model = Order::class;

    public function definition(): array
    {
        $subtotal = fake()->randomElement([25000, 45000, 75000, 100000, 150000]);
        $tax      = round($subtotal * 0.11);
        $total    = $subtotal + $tax;

        return [
            'cashier_id'            => User::factory(),
            'order_number'          => 'ORD-' . now()->format('Ymd') . '-' . strtoupper(Str::random(5)),
            'customer_name'         => fake()->optional()->name(),
            'customer_phone'        => fake()->optional()->phoneNumber(),
            'subtotal'              => $subtotal,
            'discount_amount'       => 0,
            'tax_amount'            => $tax,
            'total'                 => $total,
            'notes'                 => null,
            'order_status'          => 'pending',
            'order_type'            => 'take_away',
            'payment_status'        => 'unpaid',
            'ordered_at'            => now(),
        ];
    }

    public function completed(): static
    {
        return $this->state([
            'order_status'   => 'completed',
            'payment_status' => 'paid',
        ]);
    }

    public function cancelled(): static
    {
        return $this->state([
            'order_status'   => 'cancelled',
            'payment_status' => 'refunded',
        ]);
    }

    public function takeAway(): static
    {
        return $this->state([
            'order_type' => 'take_away',
        ]);
    }
}
