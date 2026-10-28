<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Services\BusinessContext;
use App\Services\ProductionInstallationService;
use Database\Seeders\RoleSeeder;
use Illuminate\Console\Command;
use LogicException;

final class InitializeProduction extends Command
{
    protected $signature = 'app:initialize-production {database : Exact name of the new, empty MySQL database}';

    protected $description = 'Initialize a new empty production database without accounts or demo business data.';

    public function handle(ProductionInstallationService $installation): int
    {
        try {
            $installation->assertNewDatabase((string) $this->argument('database'));
            if ($this->call('migrate', ['--force' => true]) !== self::SUCCESS) {
                return self::FAILURE;
            }
            app(BusinessContext::class)->resetSchema();
            if ($this->call('db:seed', ['--class' => RoleSeeder::class, '--force' => true]) !== self::SUCCESS) {
                return self::FAILURE;
            }
            $installation->prepareMigratedDatabase(freshlyMigrated: true);
        } catch (LogicException $exception) {
            $this->error($exception->getMessage());

            return self::FAILURE;
        }
        $this->info('Production kosong siap. Belum ada akun owner atau data usaha.');

        return self::SUCCESS;
    }
}
