<?php

namespace Tests\Feature\Payment;

use App\Enums\OrderStatus;
use App\Events\OrderStatusUpdated;
use App\Http\Requests\Payment\StorePaymentRequest;
use App\Models\Order;
use App\Models\User;
use App\Policies\OrderPolicy;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Support\Facades\Validator;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class AuditRemediationTest extends TestCase
{
    #[Test]
    public function public_cannot_confirm_payment_via_manual_endpoint(): void
    {
        $response = $this->postJson('/api/customer/order/some-uuid/confirm-payment', [
            'customer_token' => str_repeat('a', 64),
        ]);

        // Route has been removed from api.php
        $response->assertNotFound();
    }

    #[Test]
    public function doku_routes_are_not_registered_when_disabled(): void
    {
        $response = $this->postJson('/api/customer/payment/qris', [
            'order_id' => '00000000-0000-0000-0000-000000000000',
        ]);

        $response->assertNotFound();
    }

    #[Test]
    public function store_payment_request_rejects_non_cash_methods(): void
    {
        $rules = (new StorePaymentRequest)->rules();

        // Non-cash should fail
        foreach (['qris', 'debit', 'credit', 'transfer', 'gopay'] as $method) {
            $validator = Validator::make([
                'order_id' => '00000000-0000-0000-0000-000000000000',
                'payment_method' => $method,
                'amount_received' => 50000,
            ], $rules);

            $this->assertTrue($validator->fails(), "Payment method '{$method}' should be rejected.");
            $this->assertArrayHasKey('payment_method', $validator->errors()->toArray());
        }

        // Cash should pass rule check for payment_method
        $validator = Validator::make([
            'order_id' => '00000000-0000-0000-0000-000000000000',
            'payment_method' => 'cash',
            'amount_received' => 50000,
        ], $rules);

        $this->assertArrayNotHasKey('payment_method', $validator->errors()->toArray());
    }

    #[Test]
    public function order_status_enum_does_not_contain_processing(): void
    {
        $this->assertNull(OrderStatus::tryFrom('processing'));
        $this->assertNotNull(OrderStatus::tryFrom('preparing'));
        $this->assertEquals('preparing', OrderStatus::Preparing->value);
        $this->assertEquals([OrderStatus::Preparing, OrderStatus::Cancelled], OrderStatus::Pending->allowedTransitions());
    }

    #[Test]
    public function order_policy_disallows_update_on_terminal_enum_statuses(): void
    {
        $policy = new OrderPolicy;
        $user = new User(['id' => '00000000-0000-0000-0000-000000000001']);

        $completedOrder = new Order;
        $completedOrder->order_status = OrderStatus::Completed;
        $this->assertFalse($policy->update($user, $completedOrder));

        $cancelledOrder = new Order;
        $cancelledOrder->order_status = OrderStatus::Cancelled;
        $this->assertFalse($policy->update($user, $cancelledOrder));
    }

    #[Test]
    public function order_status_updated_event_is_queued_and_not_blocking(): void
    {
        $implements = class_implements(OrderStatusUpdated::class);

        $this->assertContains(ShouldBroadcast::class, $implements);
        $this->assertNotContains(ShouldBroadcastNow::class, $implements);
    }
}
