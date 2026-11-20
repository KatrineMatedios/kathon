<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ActivityLogResource;
use App\Http\Resources\ClaimResource;
use App\Http\Resources\ItemResource;
use App\Http\Resources\SupportTicketResource;
use App\Http\Resources\UserResource;
use App\Models\ActivityLog;
use App\Models\Category;
use App\Models\Claim;
use App\Models\Item;
use App\Models\SupportTicket;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class AdminController extends Controller
{
    public function dashboard()
    {
        return response()->json([
            'stats' => [
                'total_users' => User::where('role', 'student')->count(),
                'total_lost_items' => Item::where('item_type', 'lost')->count(),
                'total_found_items' => Item::where('item_type', 'found')->count(),
                'pending_reports' => Item::where('item_status', 'pending')->count(),
                'pending_claims' => Claim::where('status', 'pending')->count(),
                'resolved_items' => Item::whereIn('item_status', ['returned', 'resolved'])->count(),
                'total_categories' => Category::count(),
            ],
            'recent_reports' => ItemResource::collection(
                Item::with(['category', 'user', 'images'])->orderBy('created_at', 'desc')->limit(5)->get()
            ),
            'recent_claims' => ClaimResource::collection(
                Claim::with(['item', 'claimant'])->orderBy('created_at', 'desc')->limit(5)->get()
            ),
        ]);
    }

    public function users(Request $request)
    {
        $query = User::query();

        if ($request->filled('q')) {
            $search = '%'.$request->string('q')->toString().'%';
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', $search)
                    ->orWhere('email', 'like', $search)
                    ->orWhere('student_id', 'like', $search);
            });
        }

        if ($request->filled('role')) {
            $query->where('role', $request->input('role'));
        }

        if ($request->filled('status')) {
            $query->where('is_active', $request->input('status') === 'active');
        }

        return UserResource::collection($query->orderBy('created_at', 'desc')->paginate(15)->withQueryString());
    }

    public function updateUserStatus(Request $request, int $id)
    {
        $user = User::findOrFail($id);

        if ($user->id === Auth::id()) {
            return response()->json(['message' => 'You cannot deactivate your own account.'], 422);
        }

        $data = $request->validate(['is_active' => ['required', 'boolean']]);
        $user->update(['is_active' => $data['is_active']]);

        $status = $data['is_active'] ? 'activated' : 'deactivated';
        notify_user($user, 'account_'.$status, 'Account '.ucfirst($status), "Your account has been {$status} by an administrator.");
        log_activity('user_'.$status, ucfirst($status).' account for '.$user->name.'.', Auth::user(), User::class, $user->id);

        return (new UserResource($user))->additional(['message' => 'User status updated successfully.']);
    }

    public function reports(Request $request)
    {
        $query = Item::with(['category', 'user', 'images']);

        if ($request->filled('q')) {
            $search = '%'.$request->string('q')->toString().'%';
            $query->where(function ($q) use ($search) {
                $q->where('item_name', 'like', $search)->orWhere('description', 'like', $search);
            });
        }

        foreach (['item_type', 'item_status', 'category_id'] as $field) {
            if ($request->filled($field)) {
                $query->where($field, $request->input($field));
            }
        }

        return ItemResource::collection($query->orderBy('created_at', 'desc')->paginate(15)->withQueryString());
    }

    public function updateReportStatus(Request $request, int $id)
    {
        $item = Item::with('user')->findOrFail($id);

        $data = $request->validate([
            'item_status' => ['required', 'in:pending,approved,rejected,returned,resolved'],
        ]);

        $item->update(['item_status' => $data['item_status']]);

        $message = "Your report for {$item->item_name} is now {$data['item_status']}.";
        notify_user($item->user, 'report_'.$data['item_status'], 'Report status updated', $message, ['item_id' => $item->id]);
        log_activity('report_status_changed', "Changed report #{$item->id} status to {$data['item_status']}.", Auth::user(), Item::class, $item->id);

        $item->load(['category', 'user', 'images']);

        return (new ItemResource($item))->additional(['message' => 'Report status updated successfully.']);
    }

    public function deleteReport(int $id)
    {
        $item = Item::findOrFail($id);

        foreach ($item->images as $image) {
            Storage::disk('public')->delete($image->path);
        }

        $name = $item->item_name;
        $item->delete();
        log_activity('report_deleted', "Deleted report #{$id} ({$name}) as administrator.", Auth::user(), Item::class, $id);

        return response()->json(['message' => 'Report deleted successfully.']);
    }

    public function claims(Request $request)
    {
        $query = Claim::with(['item', 'claimant', 'reviewer']);

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        return ClaimResource::collection($query->orderBy('created_at', 'desc')->paginate(15)->withQueryString());
    }

    public function updateClaimStatus(Request $request, int $id)
    {
        return app(ClaimController::class)->update($request, $id);
    }

    public function activityLogs(Request $request)
    {
        $query = ActivityLog::with('user');

        if ($request->filled('action')) {
            $query->where('action', 'like', '%'.$request->input('action').'%');
        }

        if ($request->filled('user_id')) {
            $query->where('user_id', $request->integer('user_id'));
        }

        return ActivityLogResource::collection($query->orderBy('created_at', 'desc')->paginate(20)->withQueryString());
    }

    public function supportTickets(Request $request)
    {
        $query = SupportTicket::with('user');

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        return SupportTicketResource::collection($query->orderBy('created_at', 'desc')->paginate(20)->withQueryString());
    }

    public function respondTicket(Request $request, int $id)
    {
        $ticket = SupportTicket::with('user')->findOrFail($id);

        $data = $request->validate([
            'status' => ['required', 'in:open,in_progress,closed'],
            'admin_response' => ['nullable', 'string'],
        ]);

        $ticket->update([
            'status' => $data['status'],
            'admin_response' => $data['admin_response'] ?? $ticket->admin_response,
            'responded_at' => now(),
        ]);

        notify_user(
            $ticket->user,
            'support_response',
            'Support request update',
            "Your support request “{$ticket->subject}” was updated to {$data['status']}."
        );
        log_activity('support_responded', "Responded to support ticket #{$ticket->id}.", Auth::user(), SupportTicket::class, $ticket->id);
        $ticket->load('user');

        return (new SupportTicketResource($ticket))->additional(['message' => 'Support request updated successfully.']);
    }
}
