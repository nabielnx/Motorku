<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Password;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable implements MustVerifyEmail
{
    use HasApiTokens, HasFactory, HasRoles, HasUuids, Notifiable;

    protected $attributes = ['is_active' => true, 'invitation_pending' => false];

    // Disable remember-me authentication, including cookies issued previously.
    protected $rememberTokenName = '';

    protected static function booted(): void
    {
        static::deleting(function (User $user) {
            $user->tokens()->delete();
            DB::table('sessions')->where('user_id', $user->id)->delete();
            Password::broker('staff_invitations')->deleteToken($user);
        });
    }

    protected $fillable = [
        'name',
        'email',
        'password',
        'avatar',
        'is_active',
        'invitation_pending',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
            'invitation_pending' => 'boolean',
        ];
    }
}
