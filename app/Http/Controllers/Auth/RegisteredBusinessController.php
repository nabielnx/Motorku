<?php

declare(strict_types=1);

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RegisterBusinessRequest;
use App\Services\BusinessOnboardingService;
use Illuminate\Auth\Events\Registered;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

final class RegisteredBusinessController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('Auth/Register');
    }

    public function store(RegisterBusinessRequest $request, BusinessOnboardingService $onboarding): RedirectResponse
    {
        try {
            $owner = $onboarding->register($request->validated());
        } catch (UniqueConstraintViolationException) {
            return back()->withErrors(['email' => 'Email atau alamat toko sudah dipakai. Periksa kembali data pendaftaran.'])->withInput($request->except(['password', 'password_confirmation']));
        }
        Auth::login($owner);
        $request->session()->regenerate();
        try {
            event(new Registered($owner));
        } catch (\Throwable $exception) {
            report($exception);

            return redirect()->route('verification.notice')->with('error', 'Usaha sudah dibuat, tetapi email belum terkirim. Gunakan tombol kirim ulang atau hubungi pengelola.');
        }

        return redirect()->route('verification.notice');
    }
}
