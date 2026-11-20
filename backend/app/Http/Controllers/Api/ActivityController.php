<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ActivityController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = ActivityLog::where('user_id', $request->user()->id)->with('user')->latest();

        if ($action = $request->query('action')) {
            $query->where('action', $action);
        }

        $perPage = max(1, min(100, (int) $request->query('per_page', 20)));
        $paginator = $query->paginate($perPage);

        return response()->json(paginated($paginator,
            $paginator->getCollection()->map(fn (ActivityLog $log) => api_activity($log))->all()
        ));
    }
}