<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Hapus tabel product_modifiers
        Schema::dropIfExists('product_modifiers');

        // 2. Hapus kolom order_type dari tabel orders
        if (Schema::hasColumn('orders', 'order_type')) {
            Schema::table('orders', function (Blueprint $table) {
                $table->dropColumn('order_type');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // 1. Buat ulang tabel product_modifiers jika rollback
        Schema::create('product_modifiers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('category')->default('topping');
            $table->decimal('price', 15, 2)->default(0.00);
            $table->boolean('is_available')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->index('category');
            $table->index('is_available');
        });

        // 2. Tambahkan kembali order_type ke orders jika rollback
        Schema::table('orders', function (Blueprint $table) {
            $table->enum('order_type', [
                'dine_in',
                'take_away'
            ])->default('take_away')->after('order_status');
        });
    }
};
