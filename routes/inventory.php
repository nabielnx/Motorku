<?php

use App\Http\Controllers\Inventory\InventoryController;
use Illuminate\Support\Facades\Route;

Route::prefix('inventory')->name('api.inventory.')->group(function () {
    Route::get('/', [InventoryController::class, 'index'])->name('index');
    Route::get('/{id}', [InventoryController::class, 'show'])->name('show');
    Route::post('/', [InventoryController::class, 'store'])->name('store');
    Route::put('/{id}', [InventoryController::class, 'update'])->name('update');

    Route::middleware('role:owner')->group(function () {
        Route::delete('/{id}', [InventoryController::class, 'destroy'])->name('destroy');
    });
});
