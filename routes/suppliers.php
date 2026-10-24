<?php

declare(strict_types=1);

use App\Http\Controllers\Supplier\SupplierController;
use Illuminate\Support\Facades\Route;

Route::middleware(['role:owner', 'throttle:120,1'])->group(function () {
    Route::get('/suppliers', [SupplierController::class, 'index'])->name('suppliers.index');
    Route::post('/suppliers', [SupplierController::class, 'store'])->name('suppliers.store');
    Route::put('/suppliers/{supplier}', [SupplierController::class, 'update'])->whereUuid('supplier')->name('suppliers.update');
    Route::delete('/suppliers/{supplier}', [SupplierController::class, 'destroy'])->whereUuid('supplier')->name('suppliers.destroy');
});
