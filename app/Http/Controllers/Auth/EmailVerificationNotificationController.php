<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Services\UserService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class EmailVerificationNotificationController extends Controller
{
    /**
     * Send a new email verification notification.
     */
    public function store(Request $request): RedirectResponse
    {
        if ($request->user()->hasVerifiedEmail()) {
            return redirect()->intended(route($request->user()->hasRole('owner') ? 'dashboard' : 'pos.index', absolute: false));
        }

        app(UserService::class)->sendVerification($request->user());

        return back()->with('status', 'verification-link-sent');
    }
}
