<?php

namespace Database\Factories;

use App\Models\Order;
use App\Models\Payment;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class PaymentFactory extends Factory
{
    protected $model = Payment::class;

    public function definition(): array
    {
        return [
            'order_id'           => Order::factory()->completed(),
            'invoice_number'     => 'INV-' . now()->format('Ymd') . '-' . strtoupper(Str::random(5)),
            'payment_channel'    => 'cash',
            'payment_method'     => 'cash',
            'amount'             => fake()->randomElement([50000, 75000, 100000, 150000]),
            'status'             => 'paid',
            'gateway_reference'  => null,
            'paid_at'            => now(),
            'expired_at'         => null,
            'raw_response'       => null,
        ];
    }

    public function qris(): static
    {
        return $this->state([
            'payment_channel'   => 'qris',
            'payment_method'    => 'qris',
            'gateway_reference' => strtoupper(Str::random(20)),
            'raw_response'      => json_encode(['provider' => 'QRIS', 'status' => 'SUCCESS']),
        ]);
    }

    public function pending(): static
    {
        return $this->state([
            'status'     => 'pending',
            'paid_at'    => null,
            'expired_at' => now()->addMinutes(15),
        ]);
    }
}
