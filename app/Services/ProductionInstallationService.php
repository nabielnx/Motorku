<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use LogicException;

final class ProductionInstallationService
{
    private const INTERNAL_TABLES = ['migrations', 'roles', 'permissions', 'role_has_permissions', 'cache', 'cache_locks', 'businesses', 'settings', 'data_types'];

    private const PRESET_TYPES = [
        'product:automotive' => ['Motor', null],
        'product:electronics' => ['Elektronik', null],
        'product:hardware' => ['Alat', null],
        'product:bicycle' => ['Sepeda', null],
        'reference:motorcycles' => ['Motor', 'motorcycles'],
    ];

    private const DEFAULTS = [
        'store' => ['name' => 'TokoM', 'logo' => '', 'phone' => '', 'email' => '', 'address' => ''],
        'tax' => ['enabled' => 'false', 'percentage' => '0'],
        'payment' => ['cash_enabled' => 'true', 'qris_enabled' => 'false', 'card_enabled' => 'false'],
        'system' => ['timezone' => 'Asia/Jakarta', 'locale' => 'id', 'currency_symbol' => 'Rp', 'deletion_enabled' => 'true'],
        'references' => ['enabled' => 'true'],
    ];

    public function assertNewDatabase(string $expectedDatabase): void
    {
        if (! app()->environment('production') || config('app.debug') || ! str_starts_with((string) config('app.url'), 'https://')) {
            throw new LogicException('Instalasi awal membutuhkan APP_ENV=production, APP_DEBUG=false, dan APP_URL HTTPS.');
        }
        if (DB::connection()->getDriverName() !== 'mysql' || $expectedDatabase !== DB::connection()->getDatabaseName()) {
            throw new LogicException('Nama database konfirmasi tidak cocok dengan koneksi MySQL production.');
        }
        if (Schema::getTables($expectedDatabase) !== [] || Schema::getViews($expectedDatabase) !== []) {
            throw new LogicException('Database harus benar-benar kosong. Tidak ada tabel atau data yang dihapus.');
        }
    }

    public function prepareMigratedDatabase(): void
    {
        DB::transaction(function (): void {
            $this->assertNoOperationalData();
            if (DB::table('settings')->exists()) {
                throw new LogicException('Pengaturan sudah ada. Instalasi awal dihentikan tanpa menimpa data.');
            }
            $types = DB::table('data_types')->get();
            if ($types->count() !== count(self::PRESET_TYPES) || $types->contains(fn ($type) => ! $this->isMigrationPreset($type))) {
                throw new LogicException('Jenis bukan preset migration baru. Tidak ada data yang dihapus.');
            }
            // Only migration-created presets in a verified unused installation.
            DB::table('data_types')->whereIn('id', $types->pluck('id'))->delete();
            foreach (self::DEFAULTS as $group => $settings) {
                foreach ($settings as $key => $value) {
                    DB::table('settings')->insert([
                        'id' => (string) Str::uuid(), 'business_id' => BusinessContext::LEGACY_ID,
                        'group' => $group, 'key' => $key, 'value' => $value, 'type' => 'string',
                        'created_at' => now(), 'updated_at' => now(),
                    ]);
                }
            }
            $this->assertReadyForRegistration();
        });
    }

    public function assertReadyForRegistration(): void
    {
        $this->assertNoOperationalData();
        if (DB::table('data_types')->exists() || ! DB::table('roles')->where('name', 'owner')->where('guard_name', 'web')->exists()) {
            throw new LogicException('Instalasi kosong membutuhkan role owner dan tanpa jenis bawaan.');
        }
        foreach (DB::table('settings')->get() as $setting) {
            if ($setting->business_id !== BusinessContext::LEGACY_ID
                || ! isset(self::DEFAULTS[$setting->group][$setting->key])
                || (string) $setting->value !== self::DEFAULTS[$setting->group][$setting->key]) {
                throw new LogicException('Pengaturan usaha bukan pengaturan instalasi kosong.');
            }
        }
    }

    private function assertNoOperationalData(): void
    {
        if (! Schema::hasTable('businesses') || DB::table('businesses')->count() !== 1
            || ! DB::table('businesses')->where('id', BusinessContext::LEGACY_ID)->exists()) {
            throw new LogicException('Instalasi sudah memiliki usaha lain atau schema belum siap.');
        }
        foreach (Schema::getTables(DB::connection()->getDatabaseName()) as $table) {
            if (! in_array($table['name'], self::INTERNAL_TABLES, true) && DB::table($table['name'])->exists()) {
                throw new LogicException('Instalasi sudah memiliki data pada tabel '.$table['name'].'. Tidak ada data yang dihapus.');
            }
        }
    }

    private function isMigrationPreset(object $type): bool
    {
        $expected = self::PRESET_TYPES[$type->kind.':'.$type->key] ?? null;

        return $expected !== null && $type->business_id === BusinessContext::LEGACY_ID && (bool) $type->is_system
            && $type->name === $expected[0] && $type->driver === $expected[1]
            && json_decode($type->fields ?? 'null', true) === [];
    }
}
