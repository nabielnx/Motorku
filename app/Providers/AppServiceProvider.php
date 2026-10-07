<?php

namespace App\Providers;

use App\Models\CashClosing;
use App\Models\Order;
use App\Models\OrderReturn;
use App\Models\Product;
use App\Services\NotificationService;
use Illuminate\Foundation\Events\DiagnosingHealth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void {}

    public function boot(): void
    {
        // Cover admin, customer and scheduled changes through the same model events.
        Order::created(fn (Order $order) => app(NotificationService::class)->orderCreated($order));
        Order::updated(fn (Order $order) => app(NotificationService::class)->orderUpdated($order));
        Product::created(fn (Product $product) => app(NotificationService::class)->stockChanged($product, true));
        Product::updated(fn (Product $product) => app(NotificationService::class)->stockChanged($product));
        OrderReturn::created(fn (OrderReturn $return) => app(NotificationService::class)->returned($return));
        CashClosing::created(fn (CashClosing $closing) => app(NotificationService::class)->cashClosed($closing));
        Event::listen(DiagnosingHealth::class, fn () => DB::select('SELECT 1'));
        Vite::prefetch(concurrency: 3);

        Password::defaults(function () {
            return Password::min(8)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols();
        });
    }
}
