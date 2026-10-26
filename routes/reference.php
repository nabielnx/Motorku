<?php

declare(strict_types=1);

use App\Http\Controllers\Reference\DataTypeController;
use App\Http\Controllers\Reference\ReferenceController;
use App\Http\Middleware\EnsureReferencesEnabled;
use Illuminate\Support\Facades\Route;

Route::middleware(['role:owner', 'throttle:120,1', EnsureReferencesEnabled::class])->group(function () {
    Route::get('/data-types', [DataTypeController::class, 'index'])->name('data-types.index');
    Route::post('/data-types', [DataTypeController::class, 'store'])->name('data-types.store');
    Route::put('/data-types/{type}', [DataTypeController::class, 'update'])->name('data-types.update');
    Route::delete('/data-types/{type}', [DataTypeController::class, 'destroy'])->name('data-types.destroy');
    Route::get('/references/{type}', [ReferenceController::class, 'index'])->name('references.index');
    Route::get('/references/{type}/products', [ReferenceController::class, 'products'])->name('references.products');
    Route::post('/references/{type}/entries', [ReferenceController::class, 'store'])->name('references.entries.store');
    Route::put('/references/{type}/entries/{entry}', [ReferenceController::class, 'update'])->name('references.entries.update');
    Route::delete('/references/{type}/entries/{entry}', [ReferenceController::class, 'destroy'])->name('references.entries.destroy');
});
