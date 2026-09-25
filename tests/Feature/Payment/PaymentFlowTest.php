<?php

namespace Tests\Feature\Payment;

use App\Models\Order;
use App\Models\Payment;
use App\Models\User;
use App\Services\DashboardService;
use App\Services\ReportService;
use Illuminate\Support\Str;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class PaymentFlowTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function cashier_payment_creates_a_ledger_entry_and_marks_order_paid(): void
    {
        $this->seed(\Database\Seeders\RoleSeeder::class);
        $cashier = User::factory()->create();
        $cashier->assignRole('cashier');

        $order = Order::factory()->create([
            'total' => 25000,
            'payment_status' => 'unpaid',
            'order_status' => 'pending',
        ]);

        $response = $this->actingAs($cashier)->postJson('/api/payments', [
            'order_id' => $order->id,
            'payment_method' => 'cash',
            'amount_received' => 30000,
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.status', 'paid')
            ->assertJsonPath('data.amount', 25000);

        $this->assertDatabaseHas('orders', [
            'id' => $order->id,
            'payment_status' => 'paid',
            'order_status' => 'pending',
        ]);
        $this->assertDatabaseHas('payments', [
            'order_id' => $order->id,
            'status' => 'paid',
            'user_id' => $cashier->id,
        ]);

        foreach (['preparing', 'ready', 'completed'] as $status) {
            $this->actingAs($cashier)->putJson("/api/orders/{$order->id}", ['order_status' => $status])->assertStatus(200);
        }

        $this->assertDatabaseHas('orders', [
            'id' => $order->id,
            'order_status' => 'completed',
        ]);
    }

    #[Test]
    public function revenue_uses_payment_time_not_order_completion_time(): void
    {
        $order = Order::factory()->create([
            'total' => 25000,
            'payment_status' => 'paid',
            'order_status' => 'completed',
            'created_at' => now()->subDay(),
        ]);
        Payment::factory()->create([
            'order_id' => $order->id,
            'amount' => 25000,
            'status' => 'paid',
            'paid_at' => now(),
        ]);

        $dashboard = app(DashboardService::class)->getDashboardStats();
        $dailyReport = app(ReportService::class)->getDailySummary(now()->toDateString());

        $this->assertSame(25000.0, $dashboard['revenue_today']);
        $this->assertSame(25000.0, (float) $dailyReport['total_revenue']);
    }

    #[Test]
    public function cashier_can_pay_order_with_existing_pending_qris_payment(): void
    {
        $this->seed(\Database\Seeders\RoleSeeder::class);
        $cashier = User::factory()->create();
        $cashier->assignRole('cashier');

        $order = Order::factory()->create([
            'total' => 16500,
            'payment_status' => 'unpaid',
            'order_status' => 'pending',
        ]);

        // Customer created a pending QRIS payment record earlier
        Payment::create([
            'order_id' => $order->id,
            'payment_method' => 'qris',
            'amount' => 16500,
            'invoice_number' => 'INV-TEST-0001',
            'status' => 'pending',
        ]);

        // Cashier accepts Cash payment for the order
        $response = $this->actingAs($cashier)->postJson('/api/payments', [
            'order_id' => $order->id,
            'payment_method' => 'cash',
            'amount_received' => 16500,
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.status', 'paid')
            ->assertJsonPath('data.amount', 16500);

        $this->assertDatabaseHas('orders', [
            'id' => $order->id,
            'payment_status' => 'paid',
        ]);

        $this->assertDatabaseHas('payments', [
            'order_id' => $order->id,
            'invoice_number' => 'INV-TEST-0001',
            'status' => 'cancelled',
        ]);

        $this->assertDatabaseHas('payments', [
            'order_id' => $order->id,
            'payment_method' => 'cash',
            'status' => 'paid',
        ]);
    }

    #[Test]
    public function paid_customer_order_is_ready_for_staff_to_prepare(): void
    {
        $this->seed(\Database\Seeders\RoleSeeder::class);
        $cashier = User::factory()->create();
        $cashier->assignRole('cashier');
        $order = Order::factory()->create([
            'total' => 20000,
            'customer_access_token' => Str::random(64),
            'payment_status' => 'unpaid',
            'order_status' => 'pending',
        ]);

        $this->actingAs($cashier)->postJson('/api/payments', [
            'order_id' => $order->id,
            'payment_method' => 'cash',
            'amount_received' => 20000,
        ])->assertCreated();

        $this->assertDatabaseHas('orders', [
            'id' => $order->id,
            'payment_status' => 'paid',
            'order_status' => 'preparing',
        ]);
    }
}
