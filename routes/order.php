<?php

use App\Http\Controllers\Order\OrderController;
use Illuminate\Support\Facades\Route;

Route::prefix('orders')->name('api.orders.')->group(function () {
    Route::get('/pending-count', [OrderController::class, 'pendingCount'])->name('pending-count');
    Route::get('/active-count', [OrderController::class, 'activeCount'])->name('active-count');
    Route::get('/', [OrderController::class, 'index'])->name('index');
    Route::get('/{id}', [OrderController::class, 'show'])->name('show');
    Route::post('/pos-sale', [OrderController::class, 'storePosSale'])->middleware('throttle:60,1')->name('pos-sale');
    Route::post('/{id}/returns', [OrderController::class, 'storeReturn'])->name('returns.store');
    Route::post('/', [OrderController::class, 'store'])->middleware('throttle:60,1')->name('store');
    Route::put('/{id}', [OrderController::class, 'update'])->name('update');
    Route::patch('/{id}/status', [OrderController::class, 'updateStatus'])->name('update-status');
    Route::delete('/{id}', [OrderController::class, 'destroy'])->name('destroy');
});
