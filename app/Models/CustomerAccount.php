<?php

declare(strict_types=1);

namespace App\Models;

use App\Notifications\CustomerResetPassword;
use App\Notifications\CustomerVerifyEmail;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

final class CustomerAccount extends Authenticatable implements MustVerifyEmail
{
    use HasUuids, Notifiable;

    protected $fillable = ['name', 'email', 'password', 'phone', 'address'];

    protected $attributes = ['auth_version' => 1];

    protected $hidden = ['password', 'google_id', 'auth_version'];

    protected $rememberTokenName = '';

    protected function casts(): array
    {
        return ['email_verified_at' => 'datetime', 'password' => 'hashed', 'auth_version' => 'integer'];
    }

    public function sendEmailVerificationNotification(): void
    {
        $this->notify(new CustomerVerifyEmail(request()->attributes->get('shop_slug')));
    }

    public function sendPasswordResetNotification($token): void
    {
        $this->notify(new CustomerResetPassword($token, request()->attributes->get('shop_slug')));
    }
}
