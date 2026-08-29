<?php

use App\Http\Controllers\Motorcycle\MotorcycleController;
use Illuminate\Support\Facades\Route;

Route::prefix('motorcycles')->name('api.motorcycles.')->group(function () {
    Route::get('/', [MotorcycleController::class, 'indexWeb'])->name('index');
    Route::post('/', [MotorcycleController::class, 'store'])->name('store');
    Route::post('/bulk-attach', [MotorcycleController::class, 'bulkAttach'])->name('bulk-attach');
    Route::put('/{id}', [MotorcycleController::class, 'update'])->name('update');
    Route::delete('/{id}', [MotorcycleController::class, 'destroy'])->name('destroy');
    Route::get('/{id}/parts', [MotorcycleController::class, 'parts'])->name('parts');
    Route::post('/{id}/parts', [MotorcycleController::class, 'attachPart'])->name('attach-part');
    Route::put('/{motorcycleId}/parts/{partId}', [MotorcycleController::class, 'updatePart'])->name('update-part');
    Route::delete('/{motorcycleId}/parts/{partId}', [MotorcycleController::class, 'detachPart'])->name('detach-part');
});
