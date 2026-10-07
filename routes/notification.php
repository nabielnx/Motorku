<?php

use App\Http\Controllers\Notification\NotificationController;
use Illuminate\Support\Facades\Route;

Route::prefix('notifications')->name('api.notifications.')->group(function () {
    Route::get('/', [NotificationController::class, 'index'])->name('index');
    Route::get('/summary', [NotificationController::class, 'summary'])->name('summary');
    Route::patch('/read-all', [NotificationController::class, 'readAll'])->name('read-all');
    Route::patch('/{id}/read', [NotificationController::class, 'read'])->whereUuid('id')->name('read');
});
