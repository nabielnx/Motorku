<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\CustomerAccount;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class CustomerAccountService
{
    public function register(array $data): CustomerAccount
    {
        return CustomerAccount::create($data);
    }

    public function saveProfile(CustomerAccount $customer, array $data): void
    {
        $customer->update($data);
    }

    public function shared(): ?array
    {
        $customer = Auth::guard('customer')->user();
        if (! $customer) {
            return null;
        }

        return [
            'id' => $customer->id, 'name' => $customer->name,
            'email' => $customer->email, 'phone' => $customer->phone, 'address' => $customer->address,
            'joined_at' => $customer->created_at->toDateString(),
            'verified' => $customer->hasVerifiedEmail(), 'google_linked' => filled($customer->google_id),
            'has_password' => filled($customer->password),
        ];
    }

    public function url(Request $request, string $path): string
    {
        $shop = $request->attributes->get('shop_slug');

        return $path.($shop ? (str_contains($path, '?') ? '&' : '?').'shop='.rawurlencode($shop) : '');
    }

    public function afterLogin(Request $request): string
    {
        $target = $request->session()->pull('customer_return', '/customer/account');

        return $this->url($request, in_array($target, ['/payment', '/order/status'], true) ? $target : '/customer/account');
    }

    public function google(Request $request, array $identity, array $attempt): string
    {
        return DB::transaction(function () use ($request, $identity, $attempt): string {
            $linked = CustomerAccount::where('google_id', $identity['id'])->first();
            if ($attempt['customer_id'] ?? null) {
                $customer = Auth::guard('customer')->user();
                if (! $customer || $customer->id !== $attempt['customer_id'] || ($linked && $linked->id !== $customer->id)) {
                    throw ValidationException::withMessages(['google' => 'Akun Google tidak dapat ditautkan. Masuk kembali ke akun pelanggan Anda.']);
                }
                $customer->forceFill(['google_id' => $identity['id']])->save();
            } else {
                if (Auth::guard('customer')->check()) {
                    throw ValidationException::withMessages(['google' => 'Anda sudah masuk. Gunakan tautkan Google di akun pelanggan.']);
                }
                if (! $linked && CustomerAccount::where('email', $identity['email'])->exists()) {
                    throw ValidationException::withMessages(['google' => 'Email ini sudah terdaftar sebagai pelanggan. Masuk dengan password, lalu tautkan Google di akun pelanggan.']);
                }
                $customer = $linked ?? CustomerAccount::create([
                    'name' => $identity['name'] ?: 'Pelanggan', 'email' => $identity['email'],
                ]);
                if (! $linked) {
                    $customer->forceFill(['google_id' => $identity['id'], 'email_verified_at' => $identity['trusted_email'] ? now() : null])->save();
                }
                Auth::guard('customer')->login($customer);
            }
            $request->session()->regenerate();
            $request->session()->put('customer_auth_version', $customer->auth_version);
            $shop = $attempt['shop'] ?? null;
            $path = in_array($attempt['return'] ?? null, ['/payment', '/order/status'], true) ? $attempt['return'] : '/customer/account';

            return $path.($shop ? '?shop='.rawurlencode($shop) : '');
        });
    }
}
