<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\AcceptStaffInvitationRequest;
use App\Services\UserService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

class StaffInvitationController extends Controller
{
    public function __construct(protected UserService $users) {}

    public function show(Request $request, string $token): Response
    {
        $email = $request->query('email');
        $email = is_string($email) ? $email : '';

        return Inertia::render('Auth/AcceptInvitation', [
            'email' => $email,
            'token' => $token,
            'valid' => $this->users->isInvitationValid($email, $token),
        ])->toResponse($request)->withHeaders([
            'Referrer-Policy' => 'no-referrer',
            'Cache-Control' => 'no-store, private',
        ]);
    }

    public function store(AcceptStaffInvitationRequest $request): RedirectResponse
    {
        $this->users->acceptInvitation($request->validated());

        return redirect()->route('login')->with('status', 'Akun berhasil diaktifkan. Silakan masuk menggunakan email dan password yang baru Anda buat.');
    }
}
