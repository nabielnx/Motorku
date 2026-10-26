<?php

declare(strict_types=1);

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RegisterGoogleBusinessRequest;
use App\Services\BusinessOnboardingService;
use App\Services\GoogleLoginService;
use Illuminate\Auth\Events\Registered;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Laravel\Socialite\Two\InvalidStateException;
use Symfony\Component\HttpFoundation\RedirectResponse as OAuthRedirect;
use Symfony\Component\HttpFoundation\Response as HttpResponse;

final class GoogleLoginController extends Controller
{
    public function redirect(Request $request, GoogleLoginService $google): OAuthRedirect
    {
        return $google->start($request);
    }

    public function link(Request $request, GoogleLoginService $google): HttpResponse
    {
        $request->validate(['current_password' => ['required', 'current_password']]);
        abort_if($request->user()->invitation_pending, 403);

        return Inertia::location($google->start($request, $request->user())->getTargetUrl());
    }

    public function callback(Request $request, GoogleLoginService $google): RedirectResponse
    {
        $attempt = $request->session()->get('google_oauth');
        $fallback = is_array($attempt) && ($attempt['kind'] ?? null) === 'customer'
            ? (($attempt['customer_id'] ?? null) ? '/customer/account' : '/customer/login').(isset($attempt['shop']) ? '?shop='.rawurlencode($attempt['shop']) : '')
            : ($request->user() ? '/profile' : '/login');
        try {
            return redirect($google->callback($request));
        } catch (ValidationException $exception) {
            return redirect($fallback)->withErrors($exception->errors());
        } catch (InvalidStateException) {
            return redirect($fallback)->withErrors(['google' => 'Sesi Google tidak valid atau sudah digunakan. Coba masuk lagi.']);
        } catch (\Throwable $exception) {
            // OAuth responses may contain credentials; never log their bodies or URLs.
            logger()->warning('Google OAuth tidak berhasil.', ['exception_class' => $exception::class]);

            return redirect($fallback)->withErrors(['google' => 'Login Google dibatalkan atau sedang tidak tersedia. Silakan coba lagi.']);
        }
    }

    public function create(Request $request, GoogleLoginService $google): Response|RedirectResponse
    {
        $identity = $google->pending($request);
        if (! $identity) {
            return redirect()->route('login')->withErrors(['google' => 'Sesi pendaftaran kedaluwarsa. Masuk dengan Google lagi.']);
        }

        return Inertia::render('Auth/Register', ['googleIdentity' => ['name' => $identity['name'], 'email' => $identity['email']]]);
    }

    public function store(RegisterGoogleBusinessRequest $request, GoogleLoginService $google, BusinessOnboardingService $onboarding): RedirectResponse
    {
        $identity = $google->pending($request);
        try {
            $owner = $onboarding->register([...$request->validated(), 'email' => $identity['email']], $identity);
        } catch (UniqueConstraintViolationException) {
            return redirect()->route('login')->withErrors(['google' => 'Email, alamat toko, atau akun Google sudah terdaftar. Silakan masuk atau ulangi pendaftaran.']);
        }
        $request->session()->forget('google_registration');
        Auth::login($owner);
        $request->session()->regenerate();
        if (! $owner->hasVerifiedEmail()) {
            try {
                event(new Registered($owner));
            } catch (\Throwable $exception) {
                report($exception);

                return redirect()->route('verification.notice')->with('error', 'Usaha sudah dibuat, tetapi email belum terkirim. Silakan kirim ulang.');
            }
        }

        return redirect($owner->hasVerifiedEmail() ? '/dashboard' : '/verify-email');
    }

    public function disconnect(Request $request, GoogleLoginService $google): RedirectResponse
    {
        $request->validate(['current_password' => ['required', 'current_password']]);
        $google->disconnect($request->user());

        return back()->with('success', 'Akun Google dilepas. Anda tetap bisa masuk dengan email dan password.');
    }
}
