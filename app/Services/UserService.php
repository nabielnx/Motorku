<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\User;
use App\Notifications\StaffInvitation;
use Illuminate\Auth\Events\Verified;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Spatie\Permission\Models\Role;

class UserService
{
    public function getAllEmployees(?int $perPage = null)
    {
        $query = User::with('roles')->latest();

        return $perPage ? $query->paginate($perPage) : $query->get();
    }

    public function createEmployee(array $data)
    {
        return DB::transaction(function () use ($data) {
            $this->lockOwnerRole();
            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => Hash::make($data['password']),
                'invitation_pending' => $data['invitation_pending'] ?? false,
            ]);

            $user->assignRole($data['role']);

            return $user;
        });
    }

    public function getEmployeeById($id)
    {
        return User::with('roles')->find($id);
    }

    public function inviteEmployee(array $data): User
    {
        return DB::transaction(function () use ($data) {
            $user = $this->createEmployee([
                'name' => $data['name'], 'email' => $data['email'], 'role' => $data['role'],
                'password' => Str::random(64), 'invitation_pending' => true,
            ]);
            $this->sendInvitation($user);

            return $user;
        });
    }

    public function resendInvitation(string $id): void
    {
        DB::transaction(function () use ($id) {
            $this->lockOwnerRole();
            $user = User::whereKey($id)->lockForUpdate()->firstOrFail();
            if (! $user->invitation_pending || ! $user->is_active) {
                throw ValidationException::withMessages(['email' => 'Undangan hanya dapat dikirim ulang untuk akun aktif yang menunggu aktivasi.']);
            }
            if (Password::broker('staff_invitations')->getRepository()->recentlyCreatedToken($user)) {
                throw ValidationException::withMessages(['email' => 'Tunggu satu menit sebelum mengirim ulang undangan.']);
            }
            $this->sendInvitation($user);
        });
    }

    public function isInvitationValid(string $email, string $token): bool
    {
        $user = User::where('email', $email)->first();

        return $user && $user->invitation_pending && $user->is_active
            && Password::broker('staff_invitations')->tokenExists($user, $token);
    }

    public function acceptInvitation(array $credentials): void
    {
        DB::transaction(function () use ($credentials) {
            $this->lockOwnerRole();
            $status = Password::broker('staff_invitations')->reset($credentials, function (User $user, string $password) {
                $user = User::whereKey($user->id)->lockForUpdate()->firstOrFail();
                if (! $user->invitation_pending || ! $user->is_active) {
                    throw ValidationException::withMessages(['email' => 'Undangan sudah tidak berlaku. Hubungi owner toko.']);
                }
                $user->forceFill([
                    'password' => Hash::make($password), 'invitation_pending' => false,
                    'email_verified_at' => now(),
                ])->save();
                event(new Verified($user));
            });
            if ($status !== Password::PASSWORD_RESET) {
                throw ValidationException::withMessages(['email' => 'Tautan undangan tidak valid atau kedaluwarsa. Minta owner mengirim ulang undangan.']);
            }
        });
    }

    public function updateProfile(User $user, array $data): void
    {
        DB::transaction(function () use ($user, $data) {
            $this->lockOwnerRole();
            $user = User::whereKey($user->id)->lockForUpdate()->firstOrFail();
            $oldEmail = $user->email;
            $user->fill($data);
            $emailChanged = $user->isDirty('email');
            if ($emailChanged) {
                DB::table(config('auth.passwords.staff_invitations.table'))->where('email', $oldEmail)->delete();
                $user->email_verified_at = null;
            }
            $user->save();
            if ($emailChanged) {
                $this->revokeOldAccess($user);
                $this->sendAccountNotification($user, new VerifyEmail);
            }
        });
        $user->refresh();
    }

    public function sendVerification(User $user): void
    {
        $this->sendAccountNotification($user, new VerifyEmail);
    }

    public function updateEmployee($id, array $data)
    {
        return DB::transaction(function () use ($id, $data) {
            $this->lockOwnerRole();
            $user = User::whereKey($id)->lockForUpdate()->firstOrFail();
            $requiresConfirmation = (($data['role'] ?? null) === 'owner' && ! $user->hasRole('owner'))
                || ! empty($data['password'])
                || (isset($data['email']) && $data['email'] !== $user->email);
            // Recheck the locked account: another owner may have edited it after form validation.
            if ($requiresConfirmation && ! Hash::check($data['owner_password'] ?? '', auth()->user()?->fresh()?->password ?? '')) {
                throw ValidationException::withMessages(['owner_password' => 'Masukkan password akun Anda untuk mengonfirmasi perubahan akses atau email.']);
            }
            if (auth()->id() === $user->id) {
                if (isset($data['role']) && ! $user->hasRole($data['role'])) {
                    throw ValidationException::withMessages(['role' => 'Anda tidak dapat mengubah role akun Anda sendiri.']);
                }
                if (isset($data['is_active']) && ! $data['is_active']) {
                    throw ValidationException::withMessages(['is_active' => 'Anda tidak dapat menonaktifkan akun Anda sendiri.']);
                }
            }
            if (($data['role'] ?? 'owner') !== 'owner' || (isset($data['is_active']) && ! $data['is_active'])) {
                $this->assertAnotherOwner($user, 'role');
            }

            $updateData = [
                'name' => $data['name'] ?? $user->name,
                'email' => $data['email'] ?? $user->email,
            ];

            $emailChanged = $updateData['email'] !== $user->email;
            if ($emailChanged) {
                Password::broker('staff_invitations')->deleteToken($user);
                $updateData['email_verified_at'] = null;
            }

            if (isset($data['is_active'])) {
                $updateData['is_active'] = (bool) $data['is_active'];
            }

            if (! empty($data['password'])) {
                if ($user->invitation_pending) {
                    throw ValidationException::withMessages(['password' => 'Password akun yang diundang dibuat oleh penerima melalui tautan aktivasi.']);
                }
                $updateData['password'] = Hash::make($data['password']);
            }

            $user->forceFill($updateData)->save();

            if ($emailChanged || ! empty($data['password'])) {
                $this->revokeOldAccess($user);
            }

            if (! empty($data['role'])) {
                $user->syncRoles([$data['role']]);
            }

            if ($emailChanged && $user->is_active) {
                if ($user->invitation_pending) {
                    $this->sendInvitation($user);
                } else {
                    $this->sendAccountNotification($user, new VerifyEmail);
                }
            }

            return $user;
        });
    }

    public function deleteEmployee($id, bool $allowSelf = false)
    {
        return DB::transaction(function () use ($id, $allowSelf) {
            $this->lockOwnerRole();
            $user = User::whereKey($id)->lockForUpdate()->firstOrFail();
            if (! $allowSelf && auth()->id() === $user->id) {
                throw ValidationException::withMessages(['user' => 'Anda tidak dapat menghapus akun Anda sendiri.']);
            }
            $this->assertAnotherOwner($user, $allowSelf ? 'password' : 'user');
            $avatar = $user->avatar;
            $deleted = $user->delete();
            if ($deleted && $avatar && str_starts_with($avatar, 'avatars/')) {
                DB::afterCommit(fn () => Storage::disk('public')->delete($avatar));
            }

            return $deleted;
        });
    }

    private function lockOwnerRole(): void
    {
        // ponytail: one owner-role lock for staff edits; refine if staff management becomes highly concurrent.
        Role::where('name', 'owner')->where('guard_name', 'web')->lockForUpdate()->first();
    }

    private function assertAnotherOwner(User $user, string $field): void
    {
        if ($user->is_active && ! $user->invitation_pending && $user->hasVerifiedEmail() && $user->hasRole('owner') && User::role('owner')->where('is_active', true)->where('invitation_pending', false)->whereNotNull('email_verified_at')->whereKeyNot($user->id)->doesntExist()) {
            throw ValidationException::withMessages([$field => 'Sistem harus memiliki minimal 1 owner aktif.']);
        }
    }

    private function sendInvitation(User $user): void
    {
        $token = Password::broker('staff_invitations')->createToken($user);
        $this->sendAccountNotification($user, new StaffInvitation($token));
    }

    private function revokeOldAccess(User $user): void
    {
        $sessions = DB::table('sessions')->where('user_id', $user->id);
        if (auth()->id() === $user->id && request()->hasSession()) {
            $sessions->where('id', '!=', request()->session()->getId());
        }
        $sessions->delete();
        $user->tokens()->delete();
    }

    private function sendAccountNotification(User $user, Notification $notification): void
    {
        try {
            $user->notify($notification);
        } catch (\Throwable $error) {
            report($error);
            throw ValidationException::withMessages(['email' => 'Email gagal dikirim. Periksa konfigurasi pengirim email, lalu coba kembali.']);
        }
    }
}
