<?php

namespace App\Http\Controllers\Profile;

use App\Http\Controllers\Controller;
use App\Http\Requests\ImageUploadRequest;
use App\Http\Requests\ProfileUpdateRequest;
use App\Models\User;
use App\Services\ImageUploadService;
use App\Services\UserService;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Display the user's profile form.
     */
    public function edit(Request $request): Response
    {
        return Inertia::render('Profile/Edit', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => session('status'),
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        app(UserService::class)->updateProfile($request->user(), $request->safe()->only(['name', 'email']));

        return Redirect::route('profile.edit');
    }

    public function uploadAvatar(ImageUploadRequest $request): JsonResponse
    {
        $user = $request->user();
        $path = app(ImageUploadService::class)->replace($request->file('avatar'), 'avatars', $user->avatar,
            function ($path) use ($user) {
                $user->update(['avatar' => $path]);

                return $path;
            }, 'avatar');

        return response()->json([
            'message' => 'Foto profil berhasil diupload!',
            'url' => Storage::url($path),
        ]);
    }

    public function deleteAvatar(Request $request): JsonResponse
    {
        $user = $request->user();

        $old = $user->avatar;
        $user->update(['avatar' => null]);
        if ($old) {
            Storage::disk('public')->delete($old);
        }

        return response()->json([
            'message' => 'Foto profil berhasil dihapus!',
        ]);
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        app(UserService::class)->deleteEmployee($user->id, true);
        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Redirect::to('/');
    }
}
