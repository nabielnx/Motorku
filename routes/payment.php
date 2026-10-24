<?php

declare(strict_types=1);

use App\Http\Controllers\Payment\PaymentController;
use App\Http\Controllers\Payment\QrisController;
use Illuminate\Support\Facades\Route;

Route::prefix('payments')->name('api.payments.')->group(function () {
    Route::post('/qris/quote', [QrisController::class, 'quote'])->middleware('throttle:60,1')->name('qris.quote');
    Route::get('/', [PaymentController::class, 'index'])->name('index');
    Route::get('/{id}', [PaymentController::class, 'show'])->name('show');
    Route::post('/', [PaymentController::class, 'store'])->name('store');
    Route::middleware('role:owner|cashier')->group(function () {
        Route::patch('/{id}/status', [PaymentController::class, 'updateStatus'])->name('update-status');

    });
});
