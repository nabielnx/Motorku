<?php

use App\Http\Controllers\User\UserController;
use Illuminate\Support\Facades\Route;

Route::prefix('users')->name('api.users.')->group(function () {
    Route::get('/', [UserController::class, 'index'])->name('index');
    Route::get('/{id}', [UserController::class, 'show'])->name('show');
    Route::post('/', [UserController::class, 'store'])->middleware('throttle:password-confirmation')->name('store');
    Route::post('/{id}/invitation', [UserController::class, 'resendInvitation'])->middleware('throttle:6,1')->name('invitation');
    Route::put('/{id}', [UserController::class, 'update'])->middleware('throttle:password-confirmation')->name('update');
    Route::delete('/{id}', [UserController::class, 'destroy'])->name('destroy');
});
