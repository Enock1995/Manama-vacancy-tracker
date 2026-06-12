<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('facilities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('district_id')->constrained('districts')->onDelete('restrict');
            $table->string('name');
            $table->string('code', 20)->unique();
            $table->enum('facility_type', [
                'Provincial Hospital',
                'District Hospital',
                'Rural Health Centre',
                'Clinic',
                'Mission Hospital',
                'Urban Council Facility'
            ]);
            $table->enum('ownership', ['MOHCC', 'Mission', 'RDC', 'Urban Council']);
            $table->enum('level_of_care', ['Primary', 'Secondary', 'Tertiary']);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index('district_id');
            $table->index('facility_type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('facilities');
    }
};