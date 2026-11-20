<?php

use App\Models\ActivityLog;
use App\Models\Category;
use App\Models\Claim;
use App\Models\Item;
use App\Models\Notification;
use App\Models\SupportTicket;
use App\Models\User;
use Illuminate\Support\Facades\Storage;

if (! function_exists('asset_url')) {
    function asset_url(?string $path): ?string
    {
        if (! $path) {
            return null;
        }
        if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
            return $path;
        }
        return url(Storage::url($path));
    }
}

if (! function_exists('api_user')) {
    function api_user(?User $user): ?array
    {
        if (! $user) {
            return null;
        }
        return [
            'id' => $user->id,
            'name' => $user->name,
            'student_id' => $user->student_id,
            'email' => $user->email,
            'email_verified' => (bool) $user->email_verified_at,
            'phone' => $user->phone,
            'profile_photo_url' => asset_url($user->profile_photo_path),
            'role' => $user->role,
            'is_active' => (bool) $user->is_active,
            'created_at' => $user->created_at?->toISOString(),
        ];
    }
}

if (! function_exists('api_reporter')) {
    function api_reporter(?User $user): ?array
    {
        if (! $user) {
            return null;
        }
        return [
            'id' => $user->id,
            'name' => $user->name,
            'student_id' => $user->student_id,
            'email' => $user->email,
        ];
    }
}

if (! function_exists('api_category')) {
    function api_category(?Category $category): ?array
    {
        if (! $category) {
            return null;
        }
        return [
            'id' => $category->id,
            'name' => $category->name,
            'icon' => $category->icon,
            'description' => $category->description,
            'is_active' => (bool) $category->is_active,
        ];
    }
}

if (! function_exists('api_item')) {
    function api_item(Item $item, ?User $viewer = null): array
    {
        $item->loadMissing(['category', 'reporter', 'images']);
        $viewer ??= auth('web')->user();

        $images = $item->images->map(fn ($image) => asset_url($image->path))->filter()->values()->all();
        $primary = $item->images->firstWhere('is_primary', true) ?? $item->images->first();

        return [
            'id' => $item->id,
            'item_name' => $item->item_name,
            'description' => $item->description,
            'item_type' => $item->item_type,
            'location' => $item->location,
            'lost_found_date' => $item->lost_found_date?->format('Y-m-d'),
            'date_reported' => $item->date_reported?->toISOString(),
            'item_status' => $item->item_status,
            'additional_information' => $item->additional_information,
            'category' => api_category($item->category),
            'images' => $images,
            'image_url' => $primary ? asset_url($primary->path) : ($images[0] ?? null),
            'reporter' => api_reporter($item->reporter),
            'is_owner' => $viewer && $viewer->id === $item->user_id,
            'claims_count' => $item->claims_count ?? $item->claims()->count(),
            'created_at' => $item->created_at?->toISOString(),
        ];
    }
}

if (! function_exists('api_claim')) {
    function api_claim(Claim $claim, ?User $viewer = null): array
    {
        $claim->loadMissing(['item.reporter', 'claimant', 'reviewer']);
        $viewer ??= auth('web')->user();

        $data = [
            'id' => $claim->id,
            'item_id' => $claim->item_id,
            'reason' => $claim->reason,
            'proof_url' => asset_url($claim->proof_path),
            'status' => $claim->status,
            'verification_code' => $claim->verification_code,
            'reviewed_at' => $claim->reviewed_at?->toISOString(),
            'created_at' => $claim->created_at?->toISOString(),
            'is_mine' => $viewer && $viewer->id === $claim->claimant_id,
        ];

        if ($claim->item) {
            $data['item'] = [
                'id' => $claim->item->id,
                'item_name' => $claim->item->item_name,
                'item_type' => $claim->item->item_type,
                'image_url' => api_item($claim->item, $viewer)['image_url'],
                'location' => $claim->item->location,
                'item_status' => $claim->item->item_status,
            ];
        }
        $data['claimant'] = api_reporter($claim->claimant);
        $data['reviewer'] = $claim->reviewer
            ? ['id' => $claim->reviewer->id, 'name' => $claim->reviewer->name]
            : null;

        return $data;
    }
}

if (! function_exists('api_notification')) {
    function api_notification(Notification $notification): array
    {
        return [
            'id' => $notification->id,
            'type' => $notification->type,
            'title' => $notification->title,
            'message' => $notification->message,
            'data' => $notification->data,
            'is_read' => (bool) $notification->is_read,
            'created_at' => $notification->created_at?->toISOString(),
        ];
    }
}

if (! function_exists('api_activity')) {
    function api_activity(ActivityLog $log): array
    {
        return [
            'id' => $log->id,
            'action' => $log->action,
            'description' => $log->description,
            'subject_type' => $log->subject_type,
            'subject_id' => $log->subject_id,
            'created_at' => $log->created_at?->toISOString(),
            'user' => $log->user ? ['id' => $log->user->id, 'name' => $log->user->name] : null,
        ];
    }
}

if (! function_exists('api_ticket')) {
    function api_ticket(SupportTicket $ticket): array
    {
        return [
            'id' => $ticket->id,
            'subject' => $ticket->subject,
            'message' => $ticket->message,
            'status' => $ticket->status,
            'admin_response' => $ticket->admin_response,
            'responded_at' => $ticket->responded_at?->toISOString(),
            'created_at' => $ticket->created_at?->toISOString(),
            'user' => api_reporter($ticket->user),
        ];
    }
}

if (! function_exists('log_activity')) {
    function log_activity(string $action, string $description, ?string $subjectType = null, ?int $subjectId = null, ?User $user = null): void
    {
        ActivityLog::create([
            'user_id' => ($user ?? auth('web')->user())?->id,
            'action' => $action,
            'description' => $description,
            'subject_type' => $subjectType,
            'subject_id' => $subjectId,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);
    }
}

if (! function_exists('notify_user')) {
    function notify_user(User $user, string $type, string $title, string $message, ?array $data = null): void
    {
        Notification::create([
            'user_id' => $user->id,
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'data' => $data,
        ]);
    }
}

if (! function_exists('paginated')) {
    function paginated($paginator, array $items, array $extra = []): array
    {
        return array_merge([
            'data' => $items,
            'links' => [
                'first' => $paginator->url(1),
                'last' => $paginator->url($paginator->lastPage()),
                'prev' => $paginator->previousPageUrl(),
                'next' => $paginator->nextPageUrl(),
            ],
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'from' => $paginator->firstItem(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'to' => $paginator->lastItem(),
                'total' => $paginator->total(),
            ],
        ], $extra);
    }
}

if (! function_exists('verification_code')) {
    function verification_code(): string
    {
        do {
            $code = strtoupper(substr(str_shuffle('ABCDEFGHJKLMNPQRSTUVWXYZ23456789'), 0, 6));
        } while (Claim::where('verification_code', $code)->exists());

        return $code;
    }
}
