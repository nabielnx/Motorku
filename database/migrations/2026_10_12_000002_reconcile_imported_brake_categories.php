<?php

use App\Services\ProductImportCategoryService;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        app(ProductImportCategoryService::class)->repairImportedBrakeCategories();
    }

    public function down(): void
    {
        // Keep the corrected product links; restoring duplicate categories would
        // require their original IDs. Deployment backups preserve the old data.
    }
};
