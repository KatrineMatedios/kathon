<?php

use App\Models\ActivityLog;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Support\Facades\Request;

if (! function_exists('log_activity')) {
    function log_activity(
        string $action,
        string $description,
        ?User $user = null,
        ?string $subjectType = null,
        ?int $subjectId = null
    ): void {
        $request = Request::instance();

        ActivityLog::create([
            'user_id' => $user?->id ?? auth('web')->id(),
            'action' => $action,
            'description' => $description,
            'subject_type' => $subjectType,
            'subject_id' => $subjectId,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);
    }
}

if (! function_exists('notify_user')) {
    function notify_user(
        User $user,
        string $type,
        string $title,
        string $message,
        array $data = []
    ): void {
        Notification::create([
            'user_id' => $user->id,
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'data' => $data,
        ]);
    }
}

if (! function_exists('admin_users')) {
    /**
     * @return \Illuminate\Database\Eloquent\Collection<int, User>
     */
    function admin_users()
    {
        return User::where('role', 'admin')->get();
    }
}
