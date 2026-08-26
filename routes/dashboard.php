<?php

use App\Http\Controllers\Dashboard\DashboardController;
use Illuminate\Support\Facades\Route;

Route::prefix('dashboard')->name('api.dashboard.')->group(function () {
    Route::get('/stats', [DashboardController::class, 'stats'])->name('stats');
    Route::get('/recent-orders', [DashboardController::class, 'recentOrders'])->name('recent-orders');
    Route::get('/revenue', [DashboardController::class, 'revenue'])->name('revenue');
});
