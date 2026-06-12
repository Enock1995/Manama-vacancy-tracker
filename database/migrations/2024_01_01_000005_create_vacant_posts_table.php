<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vacant_posts', function (Blueprint $table) {
            $table->id();

            // GROUP 1: Facility Identification
            $table->foreignId('facility_id')->constrained('facilities')->onDelete('restrict');
            $table->foreignId('district_id')->constrained('districts')->onDelete('restrict');

            // GROUP 2: Post Identification
            $table->string('establishment_post_number')->nullable();
            $table->foreignId('cadre_id')->constrained('cadres')->onDelete('restrict');
            $table->string('grade_scale', 10)->nullable(); // e.g. D1, C2
            $table->string('department')->nullable();
            $table->enum('post_category', [
                'Clinical', 'Paramedical', 'Nursing',
                'Environmental Health', 'Administrative', 'Support Services'
            ]);
            $table->boolean('is_essential_service')->default(false);

            // GROUP 3: Vacancy Details
            $table->date('date_fell_vacant');
            $table->enum('reason_for_vacancy', [
                'Retirement', 'Resignation', 'Death', 'Transfer',
                'Promotion', 'Dismissal', 'Study Leave', 'Secondment', 'New Post'
            ]);
            $table->string('previous_incumbent_name')->nullable();
            $table->enum('patient_care_impact', ['Critical', 'Significant', 'Moderate', 'Minimal']);

            // GROUP 4: Interim Arrangements
            $table->enum('is_post_covered', ['Yes', 'No', 'Partially'])->default('No');
            $table->enum('coverage_arrangement', [
                'Acting', 'Locum', 'Redistributed', 'Cross-posting', 'Unfilled'
            ])->nullable();
            $table->string('person_covering_name')->nullable();
            $table->decimal('locum_cost_per_month', 10, 2)->nullable();
            $table->date('coverage_start_date')->nullable();
            $table->enum('is_coverage_sustainable', ['Yes', 'No', 'Short-term'])->nullable();

            // GROUP 5: MOHCC Channel
            $table->date('date_submitted_to_mohcc')->nullable();
            $table->string('mohcc_reference_number')->nullable();
            $table->enum('mohcc_approval_status', ['Pending', 'Approved', 'Deferred', 'Rejected'])->nullable();
            $table->date('date_mohcc_approval_received')->nullable();
            $table->text('mohcc_comments')->nullable();

            // GROUP 6: Treasury Concurrence
            $table->date('date_tc_requested')->nullable();
            $table->string('tc_request_reference')->nullable();
            $table->boolean('tc_granted')->default(false);
            $table->date('date_tc_granted')->nullable();
            $table->string('tc_reference_number')->nullable();
            $table->date('tc_expiry_date')->nullable();
            $table->boolean('tc_utilised')->default(false);
            $table->enum('tc_status', [
                'Pending', 'Granted', 'Utilized', 'Expired', 'Rejected', 'Deferred'
            ])->nullable();

            // GROUP 7: Recruitment Process
            $table->boolean('requires_hpa_registration')->default(false);
            $table->date('date_post_advertised')->nullable();
            $table->string('advertisement_reference')->nullable();
            $table->boolean('interviews_conducted')->default(false);
            $table->date('date_interviews_held')->nullable();
            $table->date('date_board_recommendation')->nullable();
            $table->date('date_appointment_letter_issued')->nullable();
            $table->string('candidate_name')->nullable();
            $table->date('expected_reporting_date')->nullable();
            $table->date('actual_reporting_date')->nullable();

            // GROUP 8: Status & Accountability
            $table->enum('overall_status', [
                'Vacant - No TC',
                'TC Pending - MOHCC',
                'TC Pending - MOF',
                'TC Granted',
                'TC Expired',
                'Recruiting',
                'Appointment Stage',
                'Filled',
                'Filled - Unconfirmed',
                'Frozen',
                'Abolished'
            ])->default('Vacant - No TC');
            $table->enum('priority_level', ['1-Critical', '2-High', '3-Medium', '4-Low']);
            $table->text('next_action_required')->nullable();
            $table->string('responsible_person_facility')->nullable();
            $table->string('responsible_person_province')->nullable();
            $table->date('follow_up_date')->nullable();
            $table->text('comments')->nullable();
            $table->foreignId('created_by')->constrained('users')->onDelete('restrict');
            $table->foreignId('updated_by')->constrained('users')->onDelete('restrict');
            $table->timestamps();

            // Indexes
            $table->index('facility_id');
            $table->index('district_id');
            $table->index('overall_status');
            $table->index('priority_level');
            $table->index('tc_expiry_date');
            $table->index('follow_up_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vacant_posts');
    }
};