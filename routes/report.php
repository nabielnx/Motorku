<?php

use App\Http\Controllers\Report\ReportController;
use Illuminate\Support\Facades\Route;

Route::prefix('reports')->name('api.reports.')->group(function () {
    Route::get('/', [ReportController::class, 'index'])->name('index');
    Route::get('/sales', [ReportController::class, 'sales'])->name('sales');
    Route::get('/export', [ReportController::class, 'export'])->name('export');
    Route::get('/daily', [ReportController::class, 'daily'])->name('daily');
    Route::get('/cash', [ReportController::class, 'cash'])->name('cash');
    Route::post('/cash/close', [ReportController::class, 'closeCash'])->name('cash.close');
});
