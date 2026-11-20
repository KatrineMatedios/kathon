<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\NotificationResource;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{
    public function index()
    {
        $notifications = Notification::where('user_id', Auth::id())
            ->orderBy('created_at', 'desc')
            ->paginate(20)
            ->withQueryString();

        return NotificationResource::collection($notifications)->additional([
            'unread_count' => Notification::where('user_id', Auth::id())->where('is_read', false)->count(),
        ]);
    }

    public function markRead(int $id)
    {
        $notification = Notification::where('user_id', Auth::id())->findOrFail($id);
        $notification->update(['is_read' => true]);

        return (new NotificationResource($notification))->additional(['message' => 'Notification marked as read.']);
    }

    public function markAllRead()
    {
        Notification::where('user_id', Auth::id())->where('is_read', false)->update(['is_read' => true]);

        return response()->json(['message' => 'All notifications marked as read.', 'unread_count' => 0]);
    }
}
