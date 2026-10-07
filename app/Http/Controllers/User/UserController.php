<?php

declare(strict_types=1);

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Http\Requests\User\StoreUserRequest;
use App\Http\Requests\User\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\UserService;
use App\Traits\ApiResponseHelpers;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class UserController extends Controller implements HasMiddleware
{
    use ApiResponseHelpers;

    public function __construct(
        protected UserService $userService
    ) {}

    public static function middleware(): array
    {
        return [
            new Middleware('role:owner'),
        ];
    }

    public function indexWeb(Request $request): InertiaResponse
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
            $query->whereHas('roles', fn ($q) => $q->where('name', $role));
        }

        $users = $query->paginate(10)->withQueryString();

        return Inertia::render('User/Index', [
            'initialUsers' => $users,
            'activeOwnersCount' => User::role('owner')->where('is_active', true)->where('invitation_pending', false)->whereNotNull('email_verified_at')->count(),
            'mailDeliveryIsLocal' => in_array(config('mail.default'), ['log', 'array'], true),
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        Gate::authorize('viewAny', User::class);

        $perPage = $request->integer('per_page', 15);
        $users = $this->userService->getAllEmployees($perPage);

        return UserResource::collection($users)->response();
    }

    public function store(StoreUserRequest $request): JsonResponse
    {
        Gate::authorize('create', User::class);

        $user = $this->userService->inviteEmployee($request->validated());

        return $this->successResponse(
            'Undangan aktivasi staf berhasil dibuat dan dikirim!',
            new UserResource($user->load('roles')),
            201
        );
    }

    public function show($id): JsonResponse
    {
        $user = $this->userService->getEmployeeById($id);

        if (! $user) {
            return $this->errorResponse('User tidak ditemukan', 404);
        }

        Gate::authorize('view', $user);

        return $this->successResponse('Detail user', new UserResource($user));
    }

    public function update(UpdateUserRequest $request, $id): JsonResponse
    {
        $user = $this->userService->getEmployeeById($id);

        if (! $user) {
            return $this->errorResponse('User tidak ditemukan', 404);
        }

        Gate::authorize('update', $user);

        $updated = $this->userService->updateEmployee($id, $request->validated());

        return $this->successResponse(
            'Akun pegawai berhasil diperbarui!',
            new UserResource($updated->load('roles'))
        );
    }

    public function destroy($id): JsonResponse
    {
        $user = $this->userService->getEmployeeById($id);

        if (! $user) {
            return $this->errorResponse('User tidak ditemukan', 404);
        }

        Gate::authorize('delete', $user);

        $this->userService->deleteEmployee($id);

        return $this->successResponse('Akun pegawai berhasil dihapus!');
    }

    public function resendInvitation(string $id): JsonResponse
    {
        $user = User::findOrFail($id);
        Gate::authorize('update', $user);
        $this->userService->resendInvitation($id);

        return $this->successResponse('Undangan aktivasi berhasil dikirim ulang.');
    }
}
