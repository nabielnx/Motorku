<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('motorcycles', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('brand', 50)->index();           // Honda, Yamaha
            $table->string('model', 100);                   // Beat, Vario 125
            $table->string('slug', 120)->unique();          // honda-beat-2020
            $table->integer('year_start');                   // 2020
            $table->integer('year_end')->nullable();         // null = masih produksi
            $table->integer('engine_cc');                    // 110, 125, 155
            $table->string('engine_type', 20)->default('matic'); // matic, bebek, sport
            $table->string('image_url')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('motorcycles');
    }
};
