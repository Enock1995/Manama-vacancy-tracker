<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cadres', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('category'); // Clinical / Nursing / Paramedical / Environmental Health / Administrative / Support Services
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cadres');
    }
};