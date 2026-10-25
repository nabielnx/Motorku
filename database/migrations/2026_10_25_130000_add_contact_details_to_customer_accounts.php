<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('customer_accounts', function (Blueprint $table): void {
            $table->string('phone', 20)->nullable();
            $table->string('address', 500)->nullable();
        });

        // Preserve the most recently saved contact when upgrading an existing
        // installation. Keep the original rows available for rollback.
        DB::table('customer_profiles')->orderBy('updated_at')->orderBy('id')->each(function (object $profile): void {
            DB::table('customer_accounts')->where('id', $profile->customer_account_id)
                ->update(['name' => $profile->name, 'phone' => $profile->phone]);
        });
    }

    public function down(): void
    {
        Schema::table('customer_accounts', function (Blueprint $table): void {
            $table->dropColumn(['phone', 'address']);
        });
    }
};
