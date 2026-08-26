<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    /**
     * Display the registration view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Register');
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        // Jika ada user yang sudah dihapus (soft-delete) dengan email yang sama,
        // ubah emailnya agar email tersebut bisa digunakan kembali untuk mendaftar.
        if ($request->email) {
            $existingDeleted = User::onlyTrashed()->where('email', strtolower($request->email))->first();
            if ($existingDeleted) {
                $existingDeleted->email = time() . '_deleted_' . $existingDeleted->email;
                $existingDeleted->save();
            }
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);

        event(new Registered($user));


        return redirect()->route('login')->with('status', 'Registrasi berhasil. Silakan tunggu Administrator/Owner untuk memberikan role sebelum Anda dapat masuk.');
    }
}
