<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Order\CustomerMenuController;
use App\Http\Controllers\Payment\DokuPaymentController;

Route::get('/user', fn(Request $request) => $request->user())
    ->middleware('auth:sanctum');

// ─── PUBLIC: Customer QR Self-Order (no auth, no CSRF) ───
Route::post('/customer/order', [CustomerMenuController::class, 'storeOrder'])
    ->middleware('throttle:10,1')
    ->name('api.customer.order');
Route::get('/customer/order/{orderId}/status', [CustomerMenuController::class, 'orderStatus'])
    ->middleware('throttle:240,1')
    ->name('api.customer.order.status');
Route::post('/customer/order/{orderId}/cancel', [CustomerMenuController::class, 'cancelOrder'])
    ->middleware('throttle:60,1')
    ->name('api.customer.order.cancel');

// ─── DOKU Gateway (Parked; disabled by default via feature flag) ───
if (config('doku.enabled', false)) {
    Route::post('/customer/payment/qris', [DokuPaymentController::class, 'createQrisPayment'])
        ->middleware('throttle:15,1')
        ->name('api.customer.payment.qris');
    Route::post('/customer/payment/qris/check-status', [DokuPaymentController::class, 'checkPaymentStatus'])
        ->middleware('throttle:180,1')
        ->name('api.customer.payment.qris.check-status');
    Route::post('/webhook/doku', [DokuPaymentController::class, 'handleWebhook'])
        ->middleware('throttle:120,1')
        ->name('api.webhook.doku');
}

$base = ['web', 'auth'];

// ─── 1. OWNER — Admin & Laporan ───
Route::middleware([...$base, 'role:owner'])->group(function () {
    require __DIR__ . '/dashboard.php';
    require __DIR__ . '/report.php';
});

// ─── 1.5. OWNER — Admin User & Setting ───
Route::middleware([...$base, 'role:owner'])->group(function () {
    require __DIR__ . '/user.php';
    require __DIR__ . '/setting.php';
});

// ─── 2. OWNER & CASHIER — Operasional ───
Route::middleware([...$base, 'role:owner|cashier'])->group(function () {
    require __DIR__ . '/order.php';
    require __DIR__ . '/payment.php';
});

// ─── 3. OWNER — Inventaris ───
Route::middleware([...$base, 'role:owner'])->group(function () {
    require __DIR__ . '/inventory.php';
});

// ─── 4. SEMUA KARYAWAN — Katalog (read), write owner ───
Route::middleware([...$base])->group(function () {
    require __DIR__ . '/product.php';
    require __DIR__ . '/category.php';
});
