<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreVacantPostRequest;
use App\Http\Requests\UpdateVacantPostRequest;
use App\Models\VacantPost;
use App\Models\Facility;
use App\Services\AuditService;
use App\Services\PriorityCalculatorService;
use Illuminate\Http\Request;

class PostController extends Controller
{
    /**
     * List posts — scoped by role
     */
    public function index(Request $request)
    {
        $user  = $request->user();
        $query = VacantPost::with(['facility', 'district', 'cadre', 'createdBy', 'updatedBy']);

        // Role-based scoping
        if ($user->hasRole('facility_user')) {
            $query->where('facility_id', $user->facility_id);
        } elseif ($user->hasRole('district_user')) {
            $query->where('district_id', $user->district_id);
        }
        // provincial_admin sees everything — no filter

        // Filters
        if ($request->filled('status')) {
            $query->where('overall_status', $request->status);
        }
        if ($request->filled('priority')) {
            $query->where('priority_level', $request->priority);
        }
        if ($request->filled('district_id') && $user->hasRole('provincial_admin')) {
            $query->where('district_id', $request->district_id);
        }
        if ($request->filled('facility_id')) {
            $query->where('facility_id', $request->facility_id);
        }
        if ($request->filled('cadre_id')) {
            $query->where('cadre_id', $request->cadre_id);
        }
        if ($request->filled('tc_expiring')) {
            $query->whereNotNull('tc_expiry_date')
                  ->where('tc_utilised', false)
                  ->whereDate('tc_expiry_date', '>=', now())
                  ->whereDate('tc_expiry_date', '<=', now()->addDays(30));
        }
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('establishment_post_number', 'like', "%{$search}%")
                  ->orWhere('previous_incumbent_name', 'like', "%{$search}%")
                  ->orWhere('candidate_name', 'like', "%{$search}%")
                  ->orWhereHas('cadre', fn($c) => $c->where('name', 'like', "%{$search}%"))
                  ->orWhereHas('facility', fn($f) => $f->where('name', 'like', "%{$search}%"));
            });
        }

        // Sorting
        $sortField = $request->get('sort_by', 'created_at');
        $sortDir   = $request->get('sort_dir', 'desc');
        $allowedSorts = [
            'created_at', 'date_fell_vacant', 'overall_status',
            'priority_level', 'tc_expiry_date', 'follow_up_date',
        ];
        if (in_array($sortField, $allowedSorts)) {
            $query->orderBy($sortField, $sortDir);
        }

        $posts = $query->paginate($request->get('per_page', 20));

        return response()->json([
            'success' => true,
            'message' => 'Posts retrieved successfully',
            'data'    => $posts,
        ]);
    }

    /**
     * Store a new vacant post
     */
    public function store(StoreVacantPostRequest $request)
    {
        $user = $request->user();
        $data = $request->validated();

        // Facility users locked to their own facility
        if ($user->hasRole('facility_user')) {
            $data['facility_id'] = $user->facility_id;
        }

        // Auto-set district from facility
        $facility            = Facility::findOrFail($data['facility_id']);
        $data['district_id'] = $facility->district_id;

        // Auto-calculate priority based on cadre, duration, coverage, impact
        $data['priority_level'] = PriorityCalculatorService::calculate($data);

        // Audit fields
        $data['created_by'] = $user->id;
        $data['updated_by'] = $user->id;

        $post = VacantPost::create($data);

        AuditService::log('VacantPost', $post->id, 'created');

        return response()->json([
            'success' => true,
            'message' => 'Vacant post created successfully',
            'data'    => $post->load(['facility', 'district', 'cadre']),
        ], 201);
    }

    /**
     * Show a single post
     */
    public function show(Request $request, int $id)
    {
        $post = $this->findAuthorized($request, $id);

        $post->load(['facility.district', 'cadre', 'createdBy', 'updatedBy']);

        // Append computed attributes
        $post->append(['vacancy_duration_months', 'tc_expiring', 'tc_expired_alert']);

        return response()->json([
            'success' => true,
            'message' => 'Post retrieved successfully',
            'data'    => $post,
        ]);
    }

    /**
     * Update a post
     */
    public function update(UpdateVacantPostRequest $request, int $id)
    {
        $post = $this->findAuthorized($request, $id);
        $data = $request->validated();

        // Cannot edit filled/abolished posts unless provincial admin
        if (
            in_array($post->overall_status, ['Filled', 'Abolished']) &&
            !$request->user()->hasRole('provincial_admin')
        ) {
            return response()->json([
                'success' => false,
                'message' => 'This post is closed and cannot be edited.',
                'data'    => null,
            ], 403);
        }

        $original           = $post->getOriginal();
        $data['updated_by'] = $request->user()->id;

        // Recalculate priority on update if vacancy-relevant fields changed
        if (
            isset($data['date_fell_vacant']) ||
            isset($data['is_post_covered']) ||
            isset($data['patient_care_impact']) ||
            isset($data['is_essential_service']) ||
            isset($data['department'])
        ) {
            $merged                 = array_merge($post->toArray(), $data);
            $data['priority_level'] = PriorityCalculatorService::calculate($merged);
        }

        $post->update($data);

        // Log every changed field
        AuditService::logChanges('VacantPost', $post->id, $original, $data);

        return response()->json([
            'success' => true,
            'message' => 'Post updated successfully',
            'data'    => $post->load(['facility', 'district', 'cadre']),
        ]);
    }

    /**
     * Update status only (quick action)
     */
    public function updateStatus(Request $request, int $id)
    {
        $request->validate([
            'overall_status' => 'required|in:Vacant - No TC,TC Pending - MOHCC,TC Pending - MOF,TC Granted,TC Expired,Recruiting,Appointment Stage,Filled,Filled - Unconfirmed,Frozen,Abolished',
            'comments'       => 'nullable|string',
        ]);

        $post      = $this->findAuthorized($request, $id);
        $oldStatus = $post->overall_status;

        $post->update([
            'overall_status' => $request->overall_status,
            'comments'       => $request->comments ?? $post->comments,
            'updated_by'     => $request->user()->id,
        ]);

        AuditService::log(
            'VacantPost',
            $post->id,
            'status_changed',
            'overall_status',
            $oldStatus,
            $request->overall_status
        );

        return response()->json([
            'success' => true,
            'message' => "Status updated to {$request->overall_status}",
            'data'    => $post,
        ]);
    }

    /**
     * Get audit history for a post
     */
    public function auditHistory(Request $request, int $id)
    {
        $post = $this->findAuthorized($request, $id);

        $logs = $post->auditLogs()
                     ->with('user:id,name,email')
                     ->orderBy('created_at', 'desc')
                     ->get();

        return response()->json([
            'success' => true,
            'message' => 'Audit history retrieved',
            'data'    => $logs,
        ]);
    }

    /**
     * Get posts with TC expiring within 30 days
     */
    public function tcExpiring(Request $request)
    {
        $user  = $request->user();
        $query = VacantPost::with(['facility', 'district', 'cadre'])
            ->whereNotNull('tc_expiry_date')
            ->where('tc_utilised', false)
            ->whereDate('tc_expiry_date', '>=', now())
            ->whereDate('tc_expiry_date', '<=', now()->addDays(30));

        if ($user->hasRole('facility_user')) {
            $query->where('facility_id', $user->facility_id);
        } elseif ($user->hasRole('district_user')) {
            $query->where('district_id', $user->district_id);
        }

        return response()->json([
            'success' => true,
            'message' => 'TC expiring soon',
            'data'    => $query->orderBy('tc_expiry_date')->get(),
        ]);
    }

    /**
     * Get critical posts (Priority 1)
     */
    public function criticalPosts(Request $request)
    {
        $user  = $request->user();
        $query = VacantPost::with(['facility', 'district', 'cadre'])
            ->where('priority_level', '1-Critical')
            ->whereNotIn('overall_status', ['Filled', 'Abolished']);

        if ($user->hasRole('facility_user')) {
            $query->where('facility_id', $user->facility_id);
        } elseif ($user->hasRole('district_user')) {
            $query->where('district_id', $user->district_id);
        }

        return response()->json([
            'success' => true,
            'message' => 'Critical posts retrieved',
            'data'    => $query->orderBy('date_fell_vacant')->get(),
        ]);
    }

    /**
     * Role-based authorization check
     */
    private function findAuthorized(Request $request, int $id): VacantPost
    {
        $user = $request->user();
        $post = VacantPost::findOrFail($id);

        if ($user->hasRole('facility_user') && $post->facility_id !== $user->facility_id) {
            abort(403, 'You do not have access to this post.');
        }

        if ($user->hasRole('district_user') && $post->district_id !== $user->district_id) {
            abort(403, 'You do not have access to this post.');
        }

        return $post;
    }
}