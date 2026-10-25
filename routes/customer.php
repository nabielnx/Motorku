<?php

declare(strict_types=1);

use App\Http\Controllers\Customer\CustomerAccountController;
use App\Http\Controllers\Customer\CustomerHistoryController;
use App\Http\Controllers\Order\CustomerMenuController;
use App\Http\Middleware\EnsureCustomerAuthenticated;
use Illuminate\Support\Facades\Route;

Route::prefix('customer')->name('customer.')->group(function (): void {
    Route::post('/checkout', [CustomerMenuController::class, 'storeOrder'])->middleware('throttle:3,1,customer-checkout:')->name('checkout');
    Route::get('/login', [CustomerAccountController::class, 'show'])->name('login');
    Route::post('/login', [CustomerAccountController::class, 'login'])->middleware('throttle:5,1')->name('login.store');
    Route::get('/register', [CustomerAccountController::class, 'show'])->name('register');
    Route::post('/register', [CustomerAccountController::class, 'register'])->middleware('throttle:5,10')->name('register.store');
    Route::get('/forgot-password', [CustomerAccountController::class, 'show'])->name('password.request');
    Route::post('/forgot-password', [CustomerAccountController::class, 'forgot'])->middleware('throttle:3,1')->name('password.email');
    Route::get('/reset-password/{token}', [CustomerAccountController::class, 'show'])->name('password.reset');
    Route::post('/reset-password', [CustomerAccountController::class, 'reset'])->middleware('throttle:5,1')->name('password.store');
    Route::get('/google', [CustomerAccountController::class, 'google'])->middleware('throttle:10,1')->name('google');
    Route::middleware(EnsureCustomerAuthenticated::class)->group(function (): void {
        Route::get('/account', [CustomerAccountController::class, 'account'])->name('account');
        Route::patch('/account', [CustomerAccountController::class, 'update'])->name('profile.update');
        Route::post('/logout', [CustomerAccountController::class, 'logout'])->name('logout');
        Route::post('/google/link', [CustomerAccountController::class, 'linkGoogle'])->middleware('throttle:5,1')->name('google.link');
        Route::get('/verify-email/{id}/{hash}', [CustomerAccountController::class, 'verify'])->middleware(['signed', 'throttle:6,1'])->name('verification.verify');
        Route::post('/verification-notification', [CustomerAccountController::class, 'resend'])->middleware('throttle:3,1')->name('verification.send');
        Route::get('/orders', [CustomerHistoryController::class, 'index'])->name('orders');
        Route::get('/orders/{id}', [CustomerHistoryController::class, 'show'])->whereUuid('id')->name('orders.show');
    });
});
