<?php

declare(strict_types=1);

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\ConfirmablePasswordController;
use App\Http\Controllers\Auth\EmailVerificationNotificationController;
use App\Http\Controllers\Auth\EmailVerificationPromptController;
use App\Http\Controllers\Auth\GoogleLoginController;
use App\Http\Controllers\Auth\PasswordController;
use App\Http\Controllers\Auth\RegisteredBusinessController;
use App\Http\Controllers\Auth\StaffInvitationController;
use App\Http\Controllers\Auth\VerifyEmailController;
use App\Http\Controllers\Profile\ProfileController;
use Illuminate\Support\Facades\Route;

Route::middleware('guest')->group(function () {
    Route::get('auth/google/redirect', [GoogleLoginController::class, 'redirect'])->middleware('throttle:10,1')->name('google.redirect');
    Route::get('register/google', [GoogleLoginController::class, 'create'])->name('google.register');
    Route::post('register/google', [GoogleLoginController::class, 'store'])->middleware('throttle:5,10');
    Route::get('register', [RegisteredBusinessController::class, 'create'])->name('register');
    Route::post('register', [RegisteredBusinessController::class, 'store'])->middleware('throttle:5,10');
    Route::get('login', [AuthenticatedSessionController::class, 'create'])
        ->name('login');

    Route::post('login', [AuthenticatedSessionController::class, 'store']);

    Route::get('staff/invitation/{token}', [StaffInvitationController::class, 'show'])
        ->middleware('throttle:10,1')->name('staff.invitation.show');
    Route::post('staff/invitation', [StaffInvitationController::class, 'store'])
        ->middleware('throttle:6,1')->name('staff.invitation.accept');

});

Route::get('auth/google/callback', [GoogleLoginController::class, 'callback'])->middleware('throttle:20,1')->name('google.callback');

Route::middleware('auth')->group(function () {
    Route::post('profile/google', [GoogleLoginController::class, 'link'])->middleware('throttle:password-confirmation')->name('google.link');
    Route::delete('profile/google', [GoogleLoginController::class, 'disconnect'])->middleware('throttle:password-confirmation')->name('google.disconnect');
    Route::get('profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('profile', [ProfileController::class, 'update'])->middleware('throttle:password-confirmation')->name('profile.update');
    Route::post('profile/avatar', [ProfileController::class, 'uploadAvatar'])->name('profile.avatar');
    Route::delete('profile/avatar', [ProfileController::class, 'deleteAvatar'])->name('profile.avatar.destroy');
    Route::delete('profile', [ProfileController::class, 'destroy'])->middleware('throttle:password-confirmation')->name('profile.destroy');

    Route::get('verify-email', EmailVerificationPromptController::class)
        ->name('verification.notice');

    Route::get('verify-email/{id}/{hash}', VerifyEmailController::class)
        ->middleware(['signed', 'throttle:6,1'])
        ->name('verification.verify');

    Route::post('email/verification-notification', [EmailVerificationNotificationController::class, 'store'])
        ->middleware('throttle:6,1')
        ->name('verification.send');

    Route::get('confirm-password', [ConfirmablePasswordController::class, 'show'])
        ->name('password.confirm');

    Route::post('confirm-password', [ConfirmablePasswordController::class, 'store'])->middleware('throttle:password-confirmation');

    Route::put('password', [PasswordController::class, 'update'])
        ->middleware('throttle:password-confirmation')
        ->name('password.update');

    Route::post('logout', [AuthenticatedSessionController::class, 'destroy'])
        ->name('logout');
});
