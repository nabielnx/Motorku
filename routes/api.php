<?php

declare(strict_types=1);

use App\Http\Controllers\Order\CustomerMenuController;
use App\Http\Controllers\Setting\SettingController;
use App\Http\Middleware\EnsureUserIsActive;
use App\Http\Middleware\ResolveBusiness;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', fn (Request $request) => $request->user())
    ->middleware(['web', 'auth:sanctum', EnsureUserIsActive::class, 'verified'])->name('api.user');

// ─── PUBLIC: Customer QR Self-Order (no auth, no CSRF) ───
Route::post('/customer/order', [CustomerMenuController::class, 'storeOrder'])
    ->middleware([ResolveBusiness::class, 'throttle:3,1'])
    ->name('api.customer.order');
Route::get('/customer/order/{orderId}/status', [CustomerMenuController::class, 'orderStatus'])
    ->middleware([ResolveBusiness::class, 'throttle:240,1'])
    ->name('api.customer.order.status');
Route::post('/customer/order/{orderId}/cancel', [CustomerMenuController::class, 'cancelOrder'])
    ->middleware([ResolveBusiness::class, 'throttle:60,1'])
    ->name('api.customer.order.cancel');

Route::post('/customer/order/{orderId}/qris', [CustomerMenuController::class, 'customerQris'])
    ->whereUuid('orderId')
    ->middleware([ResolveBusiness::class, 'throttle:30,1'])
    ->name('api.customer.order.qris');

$base = ['web', 'auth', 'verified'];

Route::middleware([...$base, 'role:owner|cashier'])
    ->get('/settings/qris-image', [SettingController::class, 'getQrisImage'])
    ->name('api.settings.qris-image.get');

// ─── 1. OWNER — Admin & Laporan ───
Route::middleware([...$base, 'role:owner'])->group(function () {
    require __DIR__.'/dashboard.php';
    require __DIR__.'/report.php';
});

// ─── 1.5. OWNER — Admin User & Setting ───
Route::middleware([...$base, 'role:owner'])->group(function () {
    require __DIR__.'/user.php';
    require __DIR__.'/setting.php';
});

// ─── 2. OWNER & CASHIER — Operasional ───
Route::middleware([...$base, 'role:owner|cashier'])->group(function () {
    require __DIR__.'/order.php';
    require __DIR__.'/payment.php';
    require __DIR__.'/notification.php';
});

// ─── 3. OWNER — Inventaris ───
Route::middleware([...$base, 'role:owner'])->group(function () {
    require __DIR__.'/inventory.php';
});

// ─── 4. SEMUA KARYAWAN — Katalog (read), write owner ───
Route::middleware([...$base])->group(function () {
    require __DIR__.'/product.php';
    require __DIR__.'/category.php';
});
