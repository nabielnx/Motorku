<?php

use App\Http\Controllers\Setting\SettingController;
use Illuminate\Support\Facades\Route;

Route::prefix('settings')->name('api.settings.')->group(function () {
    Route::get('/', [SettingController::class, 'index'])->name('index');
    Route::post('/', [SettingController::class, 'saveAll'])->name('saveAll');
    Route::post('/reset-transactions', [SettingController::class, 'resetTransactions'])->name('reset-transactions');
    Route::post('/logo', [SettingController::class, 'uploadLogo'])->name('logo');
    Route::delete('/logo', [SettingController::class, 'deleteLogo'])->name('logo.delete');
    Route::get('/logo', [SettingController::class, 'getLogo'])->name('logo.get');
    Route::get('/banners', [SettingController::class, 'getPromoBanners'])->name('banners.get');
    Route::post('/banners', [SettingController::class, 'uploadPromoBanner'])->name('banners.upload');
    Route::delete('/banners/{slot}', [SettingController::class, 'deletePromoBanner'])->name('banners.delete');
    Route::get('/{id}', [SettingController::class, 'show'])->name('show');
    Route::put('/{id}', [SettingController::class, 'update'])->name('update');
});

