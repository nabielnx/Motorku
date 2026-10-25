<?php

declare(strict_types=1);

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Http\Requests\Customer\CustomerAccountRequest;
use App\Services\CustomerAccountService;
use App\Services\GoogleLoginService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

final class CustomerAccountController extends Controller
{
    public function __construct(private CustomerAccountService $customers) {}

    public function show(Request $request): Response|RedirectResponse
    {
        $mode = match ($request->route()->getName()) {
            'customer.register' => 'register', 'customer.password.request' => 'forgot',
            'customer.password.reset' => 'reset', default => 'login',
        };
        if (Auth::guard('customer')->check() && in_array($mode, ['login', 'register'], true)) {
            return redirect($this->customers->afterLogin($request));
        }
        if (in_array($request->query('return'), ['/payment', '/order/status'], true)) {
            $request->session()->put('customer_return', $request->query('return'));
        }

        return Inertia::render('Customer/Auth', [
            'mode' => $mode, 'token' => $request->route('token'), 'email' => $request->query('email', ''),
            'returnTo' => $request->session()->get('customer_return', '/'),
        ]);
    }

    public function register(CustomerAccountRequest $request): RedirectResponse
    {
        abort_if(Auth::guard('customer')->check(), 409);
        $customer = $this->customers->register($request->validated());
        Auth::guard('customer')->login($customer);
        $request->session()->put('customer_auth_version', $customer->auth_version);
        $request->session()->regenerate();
        $this->sendVerification($customer);

        return redirect($this->customers->afterLogin($request));
    }

    public function login(CustomerAccountRequest $request): RedirectResponse
    {
        abort_if(Auth::guard('customer')->check(), 409);
        if (! Auth::guard('customer')->attempt($request->validated())) {
            throw ValidationException::withMessages(['email' => 'Email atau password pelanggan tidak sesuai.']);
        }
        $request->session()->put('customer_auth_version', Auth::guard('customer')->user()->auth_version);
        $request->session()->regenerate();

        return redirect($this->customers->afterLogin($request));
    }

    public function account(): Response
    {
        return Inertia::render('Customer/Account');
    }

    public function update(CustomerAccountRequest $request): RedirectResponse
    {
        $this->customers->saveProfile(Auth::guard('customer')->user(), $request->validated());

        return back()->with('success', 'Informasi akun pelanggan berhasil disimpan.');
    }

    public function logout(Request $request): RedirectResponse
    {
        Auth::guard('customer')->logout();
        $request->session()->forget('customer_auth_version');
        $request->session()->forget('customer_return');
        $request->session()->regenerate();
        $request->session()->regenerateToken();

        return redirect($this->customers->url($request, '/'));
    }

    public function google(Request $request, GoogleLoginService $google): \Symfony\Component\HttpFoundation\Response
    {
        abort_if(Auth::guard('customer')->check(), 409);

        return $google->startCustomer($request);
    }

    public function linkGoogle(CustomerAccountRequest $request, GoogleLoginService $google): \Symfony\Component\HttpFoundation\Response
    {
        return Inertia::location($google->startCustomer($request, Auth::guard('customer')->id())->getTargetUrl());
    }

    public function verify(Request $request): RedirectResponse
    {
        $customer = Auth::guard('customer')->user();
        abort_unless($customer->id === $request->route('id') && hash_equals(sha1($customer->getEmailForVerification()), $request->route('hash')), 403);
        $customer->markEmailAsVerified();

        return redirect($this->customers->url($request, '/customer/account'))->with('success', 'Email pelanggan berhasil diverifikasi.');
    }

    public function resend(): RedirectResponse
    {
        $customer = Auth::guard('customer')->user();
        if (! $customer->hasVerifiedEmail()) {
            $this->sendVerification($customer);
        }

        return back()->with('success', 'Permintaan email verifikasi sudah diproses. Periksa kotak masuk Anda.');
    }

    public function forgot(CustomerAccountRequest $request): RedirectResponse
    {
        // Identical response for known and unknown addresses.
        try {
            Password::broker('customers')->sendResetLink($request->validated());
        } catch (\Throwable $exception) {
            report($exception);
        }

        return back()->with('success', 'Jika email terdaftar, tautan untuk membuat atau mengganti password akan dikirim.');
    }

    public function reset(CustomerAccountRequest $request): RedirectResponse
    {
        $status = Password::broker('customers')->reset($request->validated(), function ($customer, string $password): void {
            $customer->forceFill(['password' => Hash::make($password), 'auth_version' => $customer->auth_version + 1])->save();
        });
        if ($status !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages(['email' => 'Tautan reset tidak valid atau sudah kedaluwarsa. Minta tautan baru.']);
        }

        return redirect($this->customers->url($request, '/customer/login'))->with('success', 'Password pelanggan berhasil diperbarui. Silakan masuk.');
    }

    private function sendVerification($customer): void
    {
        try {
            $customer->sendEmailVerificationNotification();
        } catch (\Throwable $exception) {
            report($exception);
        }
    }
}
