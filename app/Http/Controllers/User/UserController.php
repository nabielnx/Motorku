<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Services\UserService;
use App\Http\Requests\User\StoreUserRequest;
use App\Http\Requests\User\UpdateUserRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Support\Facades\Gate;
use App\Models\User;

class UserController extends Controller implements HasMiddleware
{
    protected $userService;

    public function __construct(UserService $userService)
    {
        $this->userService = $userService;
    }

    public static function middleware(): array
    {
        return [
            new Middleware('role:owner', only: ['index', 'show', 'store', 'update', 'destroy', 'indexWeb']),
        ];
    }

    public function indexWeb(\Illuminate\Http\Request $request)
    {
        $search = $request->string('search')->value();
        $role = $request->string('role')->value();
        $query = User::with('roles')->latest();

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($role && in_array($role, ['owner', 'cashier'], true)) {
            $query->whereHas('roles', fn($q) => $q->where('name', $role));
        }

        $users = $query->paginate(10)->withQueryString();

        return \Inertia\Inertia::render('User/Index', [
            'initialUsers' => $users,
        ]);
    }

    public function index(\Illuminate\Http\Request $request): JsonResponse
    {
        Gate::authorize('viewAny', User::class);

        $perPage = $request->integer('per_page', 15);
        $users = $this->userService->getAllEmployees($perPage);
        return response()->json($users);
    }

    public function store(StoreUserRequest $request): JsonResponse
    {
        Gate::authorize('create', User::class);

        $user = $this->userService->createEmployee($request->validated());

        return response()->json([
            'message' => 'Akun pegawai berhasil didaftarkan!',
            'data' => $user->load('roles')
        ], 201);
    }

    public function show($id): JsonResponse
    {
        $user = $this->userService->getEmployeeById($id);

        if (!$user) {
            return response()->json(['message' => 'User tidak ditemukan'], 404);
        }

        Gate::authorize('view', $user);

        return response()->json($user);
    }

    public function update(UpdateUserRequest $request, $id): JsonResponse
    {
        $user = $this->userService->getEmployeeById($id);

        if (!$user) {
            return response()->json(['message' => 'User tidak ditemukan'], 404);
        }

        Gate::authorize('update', $user);

        $authId = auth()->id();

        // GUARD 1: Prevent changing own role
        if ($authId === $user->id && $request->has('role')) {
            $currentRole = $user->roles->first()?->name;
            if ($request->input('role') !== $currentRole) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'role' => 'Anda tidak dapat mengubah role akun Anda sendiri.',
                ]);
            }
        }

        // GUARD 2: Prevent deactivating self
        if ($authId === $user->id && $request->has('is_active') && ! $request->boolean('is_active')) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'is_active' => 'Anda tidak dapat menonaktifkan akun Anda sendiri.',
            ]);
        }

        // GUARD 3: Prevent 0 active owners
        $isCurrentOwner = $user->hasRole('owner');
        $newRoleIsCashier = $request->has('role') && $request->input('role') === 'cashier';
        $deactivatingOwner = $request->has('is_active') && ! $request->boolean('is_active');

        if ($isCurrentOwner && ($newRoleIsCashier || $deactivatingOwner)) {
            $otherActiveOwners = User::role('owner')
                ->where('is_active', true)
                ->where('id', '!=', $user->id)
                ->count();

            if ($otherActiveOwners === 0) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'role' => 'Tidak dapat mengubah role. Sistem harus memiliki minimal 1 owner aktif.',
                ]);
            }
        }

        $updated = $this->userService->updateEmployee($id, $request->validated());

        return response()->json([
            'message' => 'Akun pegawai berhasil diperbarui!',
            'data' => $updated
        ]);
    }

    public function destroy($id): JsonResponse
    {
        $user = $this->userService->getEmployeeById($id);

        if (!$user) {
            return response()->json(['message' => 'User tidak ditemukan'], 404);
        }

        Gate::authorize('delete', $user);

        // GUARD 1: Prevent deleting self
        if (auth()->id() === $user->id) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'user' => 'Anda tidak dapat menghapus akun Anda sendiri.',
            ]);
        }

        // GUARD 2: Prevent deleting last active owner
        if ($user->hasRole('owner')) {
            $otherActiveOwners = User::role('owner')
                ->where('is_active', true)
                ->where('id', '!=', $user->id)
                ->count();

            if ($otherActiveOwners === 0) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'user' => 'Tidak dapat menghapus owner terakhir yang aktif.',
                ]);
            }
        }

        $this->userService->deleteEmployee($id);

        return response()->json([
            'message' => 'Akun pegawai berhasil dihapus!'
        ]);
    }
}
