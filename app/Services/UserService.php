<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

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
            $user = User::findOrFail($id);

            $updateData = [
                'name' => $data['name'] ?? $user->name,
                'email' => $data['email'] ?? $user->email,
            ];

            if (isset($data['is_active'])) {
                $updateData['is_active'] = (bool) $data['is_active'];
            }

            if (!empty($data['password'])) {
                $updateData['password'] = Hash::make($data['password']);
            }

            $user->update($updateData);

            if (!empty($data['role'])) {
                $user->syncRoles([$data['role']]);
            }

            return $user;
        });
    }

    public function deleteEmployee($id)
    {
        return User::findOrFail($id)->delete();
    }
}
