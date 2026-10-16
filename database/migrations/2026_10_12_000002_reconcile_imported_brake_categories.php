<?php

use App\Services\Migrations\ReconcileImportedBrakeCategories20261012;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        app(ReconcileImportedBrakeCategories20261012::class)->run();
    }

    public function down(): void
    {
        // Keep the corrected product links; restoring duplicate categories would
        // require their original IDs. Deployment backups preserve the old data.
    }
};
