<?php

use App\Http\Controllers\Payment\DokuPaymentController;
use App\Http\Controllers\Payment\PaymentController;
use Illuminate\Support\Facades\Route;

Route::prefix('payments')->name('api.payments.')->group(function () {
    Route::get('/', [PaymentController::class, 'index'])->name('index');
    Route::get('/{id}', [PaymentController::class, 'show'])->name('show');
    Route::post('/', [PaymentController::class, 'store'])->name('store');
    Route::middleware('role:owner|cashier')->group(function () {
        Route::patch('/{id}/status', [PaymentController::class, 'updateStatus'])->name('update-status');

        // QRIS via Doku untuk POS kasir (tanpa customer_token)
        Route::post('/doku-qris', [DokuPaymentController::class, 'createPosQrisPayment'])->name('doku-qris');
        Route::post('/doku-qris/check-status', [DokuPaymentController::class, 'checkPosQrisPayment'])->name('doku-qris.check-status');
    });
});
