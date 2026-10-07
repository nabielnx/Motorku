<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Services\UserService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Password;
use Spatie\Permission\Models\Role;

class CreateOwner extends Command
{
    protected $signature = 'app:create-owner {email} {--name=Owner}';

    protected $description = 'Provision the first active owner using a hidden password prompt.';

    public function handle(UserService $users): int
    {
        if (! Role::where('name', 'owner')->where('guard_name', 'web')->exists()) {
            $this->error('Jalankan db:seed --class=RoleSeeder --force terlebih dahulu.');

            return self::FAILURE;
        }
        if (User::role('owner')->where('is_active', true)->exists()) {
            $this->error('Owner aktif sudah ada. Tambahkan staf melalui Kelola Staf.');

            return self::FAILURE;
        }
        $data = [
            'name' => $this->option('name'), 'email' => strtolower(trim($this->argument('email'))), 'role' => 'owner',
            'password' => $this->secret('Password owner'),
            'password_confirmation' => $this->secret('Ulangi password'),
        ];
        $validator = Validator::make($data, [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'confirmed', Password::defaults()],
        ]);
        if ($validator->fails()) {
            foreach ($validator->errors()->all() as $message) {
                $this->error($message);
            }

            return self::FAILURE;
        }
        $users->createEmployee($data);
        $this->info('Owner berhasil dibuat.');
        $this->info('Masuk dan kirim email verifikasi untuk mengaktifkan akses toko.');

        return self::SUCCESS;
    }
}
