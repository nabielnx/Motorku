<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Scopes\BusinessScope;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\GoogleProvider;
use Symfony\Component\HttpFoundation\RedirectResponse;

final class GoogleLoginService
{
    public function enabled(): bool
    {
        return filled(config('services.google.client_id')) && filled(config('services.google.client_secret'));
    }

    public function start(Request $request, ?User $linkUser = null): RedirectResponse
    {
        abort_unless($this->enabled(), 404);
        $request->session()->forget('google_registration');
        $request->session()->put('google_oauth', ['user_id' => $linkUser?->id, 'started_at' => time()]);

        return $this->provider()->with(['prompt' => 'select_account'])->redirect();
    }

    public function callback(Request $request): string
    {
        abort_unless($this->enabled(), 404);
        $attempt = $request->session()->pull('google_oauth');
        if (! is_array($attempt) || ($attempt['started_at'] ?? 0) < time() - 600) {
            throw ValidationException::withMessages(['google' => 'Sesi login Google kedaluwarsa. Silakan mulai lagi.']);
        }
        // Keep Socialite's session state verification and PKCE enabled.
        $google = $this->provider()->user();
        $raw = $google->getRaw();
        $identity = [
            'id' => (string) $google->getId(), 'name' => mb_substr((string) $google->getName(), 0, 120),
            'email' => strtolower((string) $google->getEmail()),
            // Google is authoritative for Gmail and verified Workspace domains.
            'trusted_email' => ($raw['email_verified'] ?? false) === true
                && (str_ends_with(strtolower((string) $google->getEmail()), '@gmail.com') || filled($raw['hd'] ?? null)),
        ];
        if ($identity['id'] === '' || strlen($identity['id']) > 255 || ! filter_var($identity['email'], FILTER_VALIDATE_EMAIL) || strlen($identity['email']) > 254) {
            throw ValidationException::withMessages(['google' => 'Google tidak memberikan identitas akun yang lengkap.']);
        }
        $linked = User::withoutGlobalScope(BusinessScope::class)->where('google_id', $identity['id'])->first();
        if ($attempt['user_id'] !== null) {
            $user = $request->user();
            if (! $user || $user->id !== $attempt['user_id'] || ! $user->is_active || $user->invitation_pending || ($linked && $linked->id !== $user->id)) {
                throw ValidationException::withMessages(['google' => 'Akun Google tidak dapat ditautkan. Masuk kembali ke akun toko Anda.']);
            }
            DB::transaction(function () use ($user, $identity): void {
                $locked = User::whereKey($user->id)->lockForUpdate()->firstOrFail();
                $locked->forceFill(['google_id' => $identity['id'], 'google_email' => $identity['email']])->save();
            });
            $request->session()->regenerate();

            return '/profile';
        }
        if ($request->user()) {
            throw ValidationException::withMessages(['google' => 'Anda sudah masuk. Tautkan Google melalui pengaturan profil.']);
        }
        if ($linked) {
            if (! $linked->is_active || $linked->invitation_pending || $linked->roles->isEmpty()) {
                throw ValidationException::withMessages(['google' => 'Akun belum aktif. Hubungi owner toko atau gunakan tautan undangan.']);
            }
            Auth::login($linked);
            $request->session()->regenerate();

            return $linked->hasVerifiedEmail() ? ($linked->hasRole('owner') ? '/dashboard' : '/pos') : '/verify-email';
        }
        // Never merge identities merely because an email address matches.
        if (User::withoutGlobalScope(BusinessScope::class)->where('email', $identity['email'])->exists()) {
            throw ValidationException::withMessages(['google' => 'Email ini sudah terdaftar. Masuk dengan password, lalu tautkan Google di Pengaturan Profil.']);
        }
        $request->session()->regenerate();
        $request->session()->put('google_registration', [...$identity, 'expires_at' => time() + 600]);

        return '/register/google';
    }

    public function pending(Request $request): ?array
    {
        $identity = $request->session()->get('google_registration');
        if (! $this->enabled() || ! is_array($identity) || ($identity['expires_at'] ?? 0) <= time()) {
            $request->session()->forget('google_registration');

            return null;
        }

        return $identity;
    }

    public function disconnect(User $user): void
    {
        $user->forceFill(['google_id' => null, 'google_email' => null])->save();
        $user->tokens()->delete();
    }

    private function provider(): GoogleProvider
    {
        // Do not reuse another request's provider, state, or cached Google user.
        Socialite::forgetDrivers();

        return Socialite::driver('google')->enablePKCE();
    }
}
