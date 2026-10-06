<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
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
            ]);

            $user->assignRole($data['role']);

            return $user;
        });
    }

    public function getEmployeeById($id)
    {
        return User::with('roles')->find($id);
    }

    public function updateEmployee($id, array $data)
    {
        return DB::transaction(function () use ($id, $data) {
            $this->lockOwnerRole();
            $user = User::whereKey($id)->lockForUpdate()->firstOrFail();
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

            if (isset($data['is_active'])) {
                $updateData['is_active'] = (bool) $data['is_active'];
            }

            if (! empty($data['password'])) {
                $updateData['password'] = Hash::make($data['password']);
            }

            $user->update($updateData);

            if (! empty($data['role'])) {
                $user->syncRoles([$data['role']]);
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
        if ($user->is_active && $user->hasRole('owner') && User::role('owner')->where('is_active', true)->whereKeyNot($user->id)->doesntExist()) {
            throw ValidationException::withMessages([$field => 'Sistem harus memiliki minimal 1 owner aktif.']);
        }
    }
}
