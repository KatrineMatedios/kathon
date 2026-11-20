<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Claim;
use App\Models\Item;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ItemController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Item::query()->with(['category', 'reporter', 'images']);

        if ($q = trim((string) $request->query('q', ''))) {
            $query->where(function ($builder) use ($q) {
                $builder->where('item_name', 'like', "%{$q}%")
                    ->orWhere('description', 'like', "%{$q}%")
                    ->orWhere('location', 'like', "%{$q}%");
            });
        }

        if ($categoryId = $request->query('category_id')) {
            $query->where('category_id', $categoryId);
        }
        if ($type = $request->query('item_type')) {
            $query->where('item_type', $type);
        }
        if ($status = $request->query('status')) {
            $query->where('item_status', $status);
        } else {
            $query->whereIn('item_status', ['approved', 'returned', 'resolved']);
        }

        $sort = $request->query('sort', 'latest');
        if ($sort === 'oldest') {
            $query->oldest('date_reported');
        } elseif ($sort === 'name') {
            $query->orderBy('item_name');
        } else {
            $query->latest('date_reported');
        }

        $perPage = max(1, min(100, (int) $request->query('per_page', 12)));
        $paginator = $query->paginate($perPage);
        $viewer = $request->user();

        return response()->json(paginated($paginator,
            $paginator->getCollection()->map(fn (Item $i) => api_item($i, $viewer))->all()
        ));
    }

    public function myReports(Request $request): JsonResponse
    {
        $perPage = max(1, min(100, (int) $request->query('per_page', 100)));
        $paginator = Item::where('user_id', $request->user()->id)
            ->with(['category', 'reporter', 'images'])
            ->latest('date_reported')
            ->paginate($perPage);
        $viewer = $request->user();

        return response()->json(paginated($paginator,
            $paginator->getCollection()->map(fn (Item $i) => api_item($i, $viewer))->all()
        ));
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $item = Item::with(['category', 'reporter', 'images', 'claims.claimant'])->findOrFail($id);
        $viewer = $request->user();
        $data = api_item($item, $viewer);

        $myClaim = $item->claims->firstWhere('claimant_id', $viewer?->id);
        $data['my_claim'] = $myClaim ? api_claim($myClaim, $viewer) : null;
        $data['claims'] = $item->claims->map(fn (Claim $c) => api_claim($c, $viewer))->values()->all();

        return response()->json($data);
    }

    public function store(Request $request): JsonResponse
    {
        return $this->createReport($request, (string) $request->input('item_type', 'lost'));
    }

    public function reportLost(Request $request): JsonResponse
    {
        return $this->createReport($request, 'lost');
    }

    public function reportFound(Request $request): JsonResponse
    {
        return $this->createReport($request, 'found');
    }

    private function createReport(Request $request, string $type): JsonResponse
    {
        $data = $request->validate([
            'item_name' => ['required', 'string', 'max:255'],
            'category_id' => ['nullable', 'exists:categories,id'],
            'description' => ['required', 'string'],
            'lost_found_date' => ['required', 'date'],
            'location' => ['required', 'string', 'max:255'],
            'additional_information' => ['nullable', 'string'],
            'images' => ['nullable', 'array', 'max:5'],
            'images.*' => ['image', 'max:5120'],
        ]);

        $item = Item::create([
            'user_id' => $request->user()->id,
            'category_id' => $data['category_id'] ?: null,
            'item_name' => $data['item_name'],
            'description' => $data['description'],
            'item_type' => $type,
            'location' => $data['location'],
            'lost_found_date' => $data['lost_found_date'],
            'date_reported' => now(),
            'item_status' => 'pending',
            'additional_information' => $data['additional_information'] ?? null,
        ]);

        $this->storeImages($item, $request);

        log_activity('report_submitted', 'Submitted '.($type === 'lost' ? 'lost' : 'found').' report: '.$item->item_name.'.', 'item', $item->id, $request->user());

        foreach (User::where('role', 'admin')->get() as $admin) {
            notify_user($admin, 'new_report', 'New item report', "{$item->item_name} was reported as {$type}.", ['item_id' => $item->id]);
        }

        return response()->json([
            'message' => 'Report submitted successfully. It will be reviewed by an administrator.',
            'item' => api_item($item->fresh(), $request->user()),
        ], 201);
    }

    private function storeImages(Item $item, Request $request): void
    {
        $files = $request->file('images', []);
        if (! is_array($files)) {
            $files = [$files];
        }
        foreach ($files as $index => $file) {
            if (! $file || ! $file->isValid()) {
                continue;
            }
            $path = $file->store('items', 'public');
            $item->images()->create([
                'path' => $path,
                'is_primary' => $index === 0 && ! $item->images()->exists(),
            ]);
        }
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $item = Item::findOrFail($id);
        $this->authorizeOwnerOrAdmin($request, $item);

        $data = $request->validate([
            'item_name' => ['required', 'string', 'max:255'],
            'category_id' => ['nullable', 'exists:categories,id'],
            'description' => ['required', 'string'],
            'location' => ['required', 'string', 'max:255'],
            'lost_found_date' => ['required', 'date'],
            'additional_information' => ['nullable', 'string'],
        ]);

        $data['category_id'] = $data['category_id'] ?: null;
        $item->update($data);

        log_activity('report_updated', "Updated report: {$item->item_name}.", 'item', $item->id, $request->user());

        return response()->json(['message' => 'Report updated successfully.', 'item' => api_item($item->fresh(), $request->user())]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $item = Item::findOrFail($id);
        $this->authorizeOwnerOrAdmin($request, $item);

        $name = $item->item_name;
        foreach ($item->images as $image) {
            Storage::disk('public')->delete($image->path);
        }
        $item->delete();

        log_activity('report_deleted', "Deleted report: {$name}.", 'item', $id, $request->user());

        return response()->json(['message' => 'Report deleted successfully.']);
    }

    private function authorizeOwnerOrAdmin(Request $request, Item $item): void
    {
        if ($request->user()->role !== 'admin' && $item->user_id !== $request->user()->id) {
            abort(403, 'You are not allowed to modify this report.');
        }
    }
}