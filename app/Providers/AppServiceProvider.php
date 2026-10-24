<?php

declare(strict_types=1);

namespace App\Providers;

use App\Auth\BusinessUserProvider;
use App\Models\CashClosing;
use App\Models\Order;
use App\Models\OrderReturn;
use App\Models\PersonalAccessToken;
use App\Models\Product;
use App\Services\BusinessContext;
use App\Services\BusinessOnboardingService;
use App\Services\NotificationService;
use Illuminate\Auth\Events\Verified;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Database\Events\MigrationsEnded;
use Illuminate\Database\Events\MigrationsStarted;
use Illuminate\Foundation\Events\DiagnosingHealth;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;
use Laravel\Sanctum\Sanctum;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->scoped(BusinessContext::class, fn () => new BusinessContext);
    }

    public function boot(): void
    {
        Auth::provider('business-eloquent', fn ($app, array $config) => new BusinessUserProvider($app['hash'], $config['model']));
        Sanctum::usePersonalAccessTokenModel(PersonalAccessToken::class);
        Event::listen(MigrationsStarted::class, fn () => app(BusinessContext::class)->resetSchema());
        Event::listen(MigrationsEnded::class, fn () => app(BusinessContext::class)->resetSchema());
        Event::listen(Verified::class, fn ($event) => app(BusinessOnboardingService::class)->activate($event->user));
        RateLimiter::for('password-confirmation', function (Request $request) {
            if (! $request->hasAny(['password', 'current_password', 'owner_password'])) {
                return Limit::none();
            }

            return [
                Limit::perMinute(5)->by('user:'.$request->user()->id),
                Limit::perMinute(15)->by('ip:'.$request->ip()),
            ];
        });

        // Cover admin, customer and scheduled changes through the same model events.
        Order::created(fn (Order $order) => app(NotificationService::class)->orderCreated($order));
        Order::updated(fn (Order $order) => app(NotificationService::class)->orderUpdated($order));
        Product::created(fn (Product $product) => app(NotificationService::class)->stockChanged($product, true));
        Product::updated(fn (Product $product) => app(NotificationService::class)->stockChanged($product));
        OrderReturn::created(fn (OrderReturn $return) => app(NotificationService::class)->returned($return));
        CashClosing::created(fn (CashClosing $closing) => app(NotificationService::class)->cashClosed($closing));
        Event::listen(DiagnosingHealth::class, fn () => DB::select('SELECT 1'));

        Password::defaults(function () {
            return Password::min(8)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols();
        });
    }
}
