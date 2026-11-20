<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Category;
use App\Models\Claim;
use App\Models\Item;
use App\Models\SupportTicket;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class AdminController extends Controller
{
    public function dashboard(): JsonResponse
    {
        return response()->json([
            'stats' => [
                'total_users' => User::count(),
                'total_lost_items' => Item::where('item_type', 'lost')->count(),
                'total_found_items' => Item::where('item_type', 'found')->count(),
                'pending_reports' => Item::where('item_status', 'pending')->count(),
                'pending_claims' => Claim::where('status', 'pending')->count(),
                'resolved_items' => Item::whereIn('item_status', ['resolved', 'returned'])->count(),
                'total_categories' => Category::count(),
            ],
            'recent_reports' => Item::with(['category', 'reporter', 'images'])->latest('date_reported')->take(5)->get()
                ->map(fn (Item $i) => api_item($i))->values(),
            'recent_claims' => Claim::with(['item.reporter', 'claimant', 'reviewer'])->latest()->take(5)->get()
                ->map(fn (Claim $c) => api_claim($c))->values(),
        ]);
    }

    public function users(Request $request): JsonResponse
    {
        $query = User::query();

        if ($q = trim((string) $request->query('q', ''))) {
            $query->where(function ($builder) use ($q) {
                $builder->where('name', 'like', "%{$q}%")
                    ->orWhere('email', 'like', "%{$q}%")
                    ->orWhere('student_id', 'like', "%{$q}%");
            });
        }
        if ($role = $request->query('role')) {
            $query->where('role', $role);
        }
        if ($status = $request->query('status')) {
            $query->where('is_active', $status === 'active');
        }

        $paginator = $query->latest()->paginate(max(1, min(100, (int) $request->query('per_page', 15))));

        return response()->json(paginated($paginator,
            $paginator->getCollection()->map(fn (User $u) => api_user($u))->all()
        ));
    }

    public function updateUserStatus(Request $request, int $id): JsonResponse
    {
        $data = $request->validate(['is_active' => ['required', 'boolean']]);
        $user = User::findOrFail($id);
        $user->update(['is_active' => $data['is_active']]);

        log_activity($data['is_active'] ? 'user_activated' : 'user_deactivated',
            ($data['is_active'] ? 'Activated' : 'Deactivated')." account: {$user->name}.", 'user', $user->id, $request->user());

        return response()->json(['message' => 'User status updated successfully.', 'user' => api_user($user->fresh())]);
    }

    public function reports(Request $request): JsonResponse
    {
        $query = Item::query()->with(['category', 'reporter', 'images']);

        if ($q = trim((string) $request->query('q', ''))) {
            $query->where(function ($builder) use ($q) {
                $builder->where('item_name', 'like', "%{$q}%")
                    ->orWhere('description', 'like', "%{$q}%")
                    ->orWhere('location', 'like', "%{$q}%");
            });
        }
        if ($type = $request->query('item_type')) {
            $query->where('item_type', $type);
        }
        if ($status = $request->query('item_status')) {
            $query->where('item_status', $status);
        }

        $paginator = $query->latest('date_reported')->paginate(max(1, min(100, (int) $request->query('per_page', 15))));

        return response()->json(paginated($paginator,
            $paginator->getCollection()->map(fn (Item $i) => api_item($i, $request->user()))->all()
        ));
    }

    public function updateReportStatus(Request $request, int $id): JsonResponse
    {
        $data = $request->validate([
            'item_status' => ['required', 'in:pending,approved,rejected,returned,resolved'],
        ]);

        $item = Item::findOrFail($id);
        $old = $item->item_status;
        $item->update(['item_status' => $data['item_status']]);

        if ($data['item_status'] === 'approved' && $old !== 'approved') {
            notify_user($item->user, 'report_approved', 'Report approved',
                "Your report for {$item->item_name} has been approved.", ['item_id' => $item->id]);
        } elseif ($data['item_status'] === 'rejected' && $old !== 'rejected') {
            notify_user($item->user, 'report_rejected', 'Report rejected',
                "Your report for {$item->item_name} was rejected.", ['item_id' => $item->id]);
        } elseif (in_array($data['item_status'], ['resolved', 'returned']) && $old !== $data['item_status']) {
            notify_user($item->user, 'item_resolved', 'Item status updated',
                "Your report for {$item->item_name} is now {$data['item_status']}.", ['item_id' => $item->id]);
        }

        log_activity('report_status_changed', "Changed status of {$item->item_name} from {$old} to {$data['item_status']}.", 'item', $item->id, $request->user());

        return response()->json(['message' => 'Report status updated successfully.', 'item' => api_item($item->fresh(), $request->user())]);
    }

    public function deleteReport(Request $request, int $id): JsonResponse
    {
        $item = Item::findOrFail($id);
        $name = $item->item_name;
        foreach ($item->images as $image) {
            Storage::disk('public')->delete($image->path);
        }
        $item->delete();

        log_activity('report_deleted', "Deleted report: {$name}.", 'item', $id, $request->user());

        return response()->json(['message' => 'Report deleted successfully.']);
    }

    public function claims(Request $request): JsonResponse
    {
        $query = Claim::query()->with(['item.reporter', 'claimant', 'reviewer']);

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        $paginator = $query->latest()->paginate(max(1, min(100, (int) $request->query('per_page', 15))));

        return response()->json(paginated($paginator,
            $paginator->getCollection()->map(fn (Claim $c) => api_claim($c, $request->user()))->all()
        ));
    }

    public function updateClaimStatus(Request $request, int $id): JsonResponse
    {
        $data = $request->validate(['status' => ['required', 'in:pending,approved,rejected']]);
        $claim = Claim::with('item')->findOrFail($id);
        $claim->update([
            'status' => $data['status'],
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ]);

        if ($data['status'] === 'approved') {
            $claim->item?->update(['item_status' => 'returned']);
        }

        notify_user($claim->claimant, $data['status'] === 'approved' ? 'claim_approved' : 'claim_rejected',
            $data['status'] === 'approved' ? 'Claim approved' : 'Claim rejected',
            "Your claim for {$claim->item?->item_name} was {$data['status']}.", ['claim_id' => $claim->id]);

        log_activity($data['status'] === 'approved' ? 'claim_approved' : 'claim_rejected',
            "{$data['status']} claim #{$claim->id}.", 'claim', $claim->id, $request->user());

        return response()->json(['message' => 'Claim status updated successfully.', 'claim' => api_claim($claim->fresh(), $request->user())]);
    }

    public function activityLogs(Request $request): JsonResponse
    {
        $query = ActivityLog::query()->with('user');

        if ($action = $request->query('action')) {
            $query->where('action', $action);
        }
        if ($userId = $request->query('user_id')) {
            $query->where('user_id', $userId);
        }

        $paginator = $query->latest()->paginate(max(1, min(100, (int) $request->query('per_page', 20))));

        return response()->json(paginated($paginator,
            $paginator->getCollection()->map(fn (ActivityLog $log) => api_activity($log))->all()
        ));
    }

    public function supportTickets(Request $request): JsonResponse
    {
        $query = SupportTicket::query()->with('user');

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        $paginator = $query->latest()->paginate(max(1, min(100, (int) $request->query('per_page', 20))));

        return response()->json(paginated($paginator,
            $paginator->getCollection()->map(fn (SupportTicket $t) => api_ticket($t))->all()
        ));
    }

    public function respondTicket(Request $request, int $id): JsonResponse
    {
        $data = $request->validate([
            'status' => ['required', 'in:open,in_progress,closed'],
            'admin_response' => ['nullable', 'string'],
        ]);

        $ticket = SupportTicket::findOrFail($id);
        $ticket->update([
            'status' => $data['status'],
            'admin_response' => $data['admin_response'] ?? null,
            'responded_by' => $request->user()->id,
            'responded_at' => now(),
        ]);

        notify_user($ticket->user, 'support_responded', 'Support request updated',
            "Your support request \"{$ticket->subject}\" has a new response.", ['ticket_id' => $ticket->id]);

        log_activity('support_responded', "Responded to support ticket #{$ticket->id}.", 'support_ticket', $ticket->id, $request->user());

        return response()->json(['message' => 'Support request updated.', 'ticket' => api_ticket($ticket->fresh())]);
    }
}