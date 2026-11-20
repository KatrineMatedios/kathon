<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $userId = $request->user()->id;
        $perPage = max(1, min(100, (int) $request->query('per_page', 20)));

        $paginator = Notification::where('user_id', $userId)->latest()->paginate($perPage);
        $unread = Notification::where('user_id', $userId)->where('is_read', false)->count();

        return response()->json(paginated($paginator,
            $paginator->getCollection()->map(fn (Notification $n) => api_notification($n))->all(),
            ['unread_count' => $unread]
        ));
    }

    public function markRead(Request $request, int $id): JsonResponse
    {
        $notification = Notification::where('user_id', $request->user()->id)->findOrFail($id);
        $notification->update(['is_read' => true]);

        return response()->json(['message' => 'Notification marked as read.']);
    }

    public function markAllRead(Request $request): JsonResponse
    {
        Notification::where('user_id', $request->user()->id)->where('is_read', false)
            ->update(['is_read' => true]);

        return response()->json(['message' => 'All notifications marked as read.']);
    }
}