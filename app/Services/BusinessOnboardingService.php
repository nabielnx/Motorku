<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Business;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

final class BusinessOnboardingService
{
    public function register(array $data, ?array $google = null): User
    {
        return DB::transaction(function () use ($data, $google): User {
            $business = Business::create(['name' => $data['business_name'], 'slug' => $data['business_slug']]);

            return app(BusinessContext::class)->run($business->id, function () use ($data, $google): User {
                $owner = User::create(['name' => $data['name'], 'email' => $data['email'], 'password' => Hash::make($data['password'])]);
                $owner->assignRole(Role::findByName('owner', 'web'));
                if ($google) {
                    $owner->forceFill(['google_id' => $google['id'], 'google_email' => $google['email'], 'email_verified_at' => $google['trusted_email'] ? now() : null])->save();
                    $this->activate($owner);
                }
                $settings = [
                    'store' => ['name' => $data['business_name'], 'email' => $data['email'], 'phone' => '', 'address' => ''],
                    'system' => ['timezone' => 'Asia/Jakarta', 'locale' => 'id', 'currency_symbol' => 'Rp', 'deletion_enabled' => 'true'],
                    'tax' => ['enabled' => 'false', 'percentage' => '0'],
                    'payment' => ['cash_enabled' => 'true', 'qris_enabled' => 'false', 'card_enabled' => 'false'],
                    'printer' => ['paper_size' => '80', 'auto_print_receipt' => 'false'],
                    'qr_order' => ['enabled' => 'true', 'session_timeout' => '120'],
                    'catalog' => ['show_total_sold' => 'true'],
                ];
                foreach ($settings as $group => $values) {
                    foreach ($values as $key => $value) {
                        app(SettingService::class)->upsertSetting($group, $key, $value);
                    }
                }

                return $owner;
            });
        }, 3);
    }

    public function activate(User $owner): void
    {
        if ($owner->hasVerifiedEmail() && $owner->is_active && $owner->hasRole('owner')) {
            Business::whereKey($owner->business_id)->whereNull('activated_at')->update(['activated_at' => now()]);
        }
    }
}
