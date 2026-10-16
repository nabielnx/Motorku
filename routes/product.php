<?php

use App\Http\Controllers\Product\ProductController;
use App\Http\Controllers\Product\ProductSheetController;
use Illuminate\Support\Facades\Route;

Route::prefix('products')->name('api.products.')->group(function () {
    Route::prefix('sheets')->name('sheets.')->middleware(['role:owner', 'throttle:20,1'])->group(function () {
        Route::post('/inspect', [ProductSheetController::class, 'inspect'])->name('inspect');
        Route::post('/preview', [ProductSheetController::class, 'preview'])->name('preview');
        Route::post('/commit', [ProductSheetController::class, 'commit'])->name('commit');
        Route::get('/export', [ProductSheetController::class, 'export'])->name('export');
        Route::get('/template', [ProductSheetController::class, 'template'])->name('template');
    });
    Route::get('/', [ProductController::class, 'index'])->name('index');
    Route::get('/{id}', [ProductController::class, 'show'])->name('show');

    Route::middleware('role:owner')->group(function () {
        Route::post('/', [ProductController::class, 'store'])->name('store');
        Route::put('/{id}', [ProductController::class, 'update'])->name('update');
        Route::delete('/{id}', [ProductController::class, 'destroy'])->name('destroy');
    });
});
