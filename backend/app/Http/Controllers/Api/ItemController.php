<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ClaimResource;
use App\Http\Resources\ItemResource;
use App\Models\Category;
use App\Models\Item;
use App\Models\ItemImage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class ItemController extends Controller
{
    private const STATUSES = ['pending', 'approved', 'rejected', 'returned', 'resolved'];

    public function index(Request $request)
    {
        $query = Item::with(['category', 'user', 'images'])
            ->where('item_status', '!=', 'rejected');

        $this->applyFilters($query, $request);

        $sort = $request->input('sort', 'latest');
        match ($sort) {
            'oldest' => $query->orderBy('date_reported', 'asc'),
            'name' => $query->orderBy('item_name', 'asc'),
            default => $query->orderBy('date_reported', 'desc'),
        };

        return ItemResource::collection($query->paginate(12)->withQueryString());
    }

    public function store(Request $request)
    {
        return $this->createItem($request, $request->input('item_type'));
    }

    public function reportLost(Request $request)
    {
        return $this->createItem($request, 'lost');
    }

    public function reportFound(Request $request)
    {
        return $this->createItem($request, 'found');
    }

    public function show(int $id)
    {
        $item = Item::with(['category', 'user', 'images'])->findOrFail($id);

        $isPrivileged = Auth::id() === $item->user_id || Auth::user()?->isAdmin();
        $item->load($isPrivileged ? ['claims.claimant'] : ['claims' => fn ($q) => $q->where('claimant_id', Auth::id())]);

        $myClaim = $item->claims->firstWhere('claimant_id', Auth::id());

        return (new ItemResource($item))->additional([
            'my_claim' => $myClaim ? new ClaimResource($myClaim) : null,
        ]);
    }

    public function update(Request $request, int $id)
    {
        $item = Item::findOrFail($id);

        if (Auth::id() !== $item->user_id && ! Auth::user()?->isAdmin()) {
            return response()->json(['message' => 'You are not allowed to edit this report.'], 403);
        }

        $data = $request->validate([
            'item_name' => ['sometimes', 'required', 'string', 'max:150'],
            'description' => ['sometimes', 'required', 'string'],
            'category_id' => ['sometimes', 'nullable', 'exists:categories,id'],
            'location' => ['sometimes', 'required', 'string', 'max:150'],
            'lost_found_date' => ['sometimes', 'required', 'date'],
            'additional_information' => ['sometimes', 'nullable', 'string'],
            'images' => ['sometimes', 'array', 'max:5'],
            'images.*' => ['image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
        ]);

        unset($data['images']);

        $item->update($data);
        $this->storeImages($request, $item);
        $item->load(['category', 'user', 'images']);

        log_activity('report_updated', "Updated report #{$item->id} ({$item->item_name}).", Auth::user(), Item::class, $item->id);

        return (new ItemResource($item))->additional(['message' => 'Report updated successfully.']);
    }

    public function destroy(int $id)
    {
        $item = Item::findOrFail($id);

        if (Auth::id() !== $item->user_id && ! Auth::user()?->isAdmin()) {
            return response()->json(['message' => 'You are not allowed to delete this report.'], 403);
        }

        foreach ($item->images as $image) {
            Storage::disk('public')->delete($image->path);
        }

        $name = $item->item_name;
        $item->delete();

        log_activity('report_deleted', "Deleted report #{$id} ({$name}).", Auth::user(), Item::class, $id);

        return response()->json(['message' => 'Report deleted successfully.']);
    }

    public function myReports(Request $request)
    {
        $query = Item::where('user_id', Auth::id())->with(['category', 'user', 'images']);

        $this->applyFilters($query, $request);
        $query->orderBy('date_reported', 'desc');

        return ItemResource::collection($query->paginate(12)->withQueryString());
    }

    public function categories()
    {
        return response()->json([
            'categories' => Category::where('is_active', true)->orderBy('name')->get(['id', 'name', 'icon']),
        ]);
    }

    private function createItem(Request $request, ?string $type): JsonResponse
    {
        $data = $request->validate([
            'item_name' => ['required', 'string', 'max:150'],
            'category_id' => ['required', 'exists:categories,id'],
            'description' => ['required', 'string', 'min:10'],
            'item_type' => [$type ? 'sometimes' : 'required', 'in:lost,found'],
            'location' => ['required', 'string', 'max:150'],
            'lost_found_date' => ['required', 'date', 'before_or_equal:today'],
            'additional_information' => ['nullable', 'string'],
            'images' => ['nullable', 'array', 'max:5'],
            'images.*' => ['image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
        ]);

        $data['item_type'] = $type ?: $data['item_type'];
        $data['user_id'] = Auth::id();
        $data['date_reported'] = now();
        $data['item_status'] = 'pending';

        $item = Item::create($data);
        $this->storeImages($request, $item);
        $item->load(['category', 'user', 'images']);

        notify_user(
            $request->user(),
            'report_submitted',
            'Report submitted',
            "Your {$data['item_type']} report for {$item->item_name} has been submitted for review."
        );
        log_activity('report_submitted', "Submitted {$data['item_type']} report: {$item->item_name}.", $request->user(), Item::class, $item->id);

        return response()->json([
            'message' => ucfirst($data['item_type']).' item report submitted successfully.',
            'item' => new ItemResource($item),
        ], 201);
    }

    private function storeImages(Request $request, Item $item): void
    {
        if (! $request->hasFile('images')) {
            return;
        }

        foreach ($request->file('images') as $index => $file) {
            $path = $file->store('items', 'public');

            $item->images()->create([
                'path' => $path,
                'is_primary' => $index === 0,
            ]);
        }
    }

    private function applyFilters($query, Request $request): void
    {
        if ($request->filled('q')) {
            $search = '%'.$request->string('q')->toString().'%';
            $query->where(function ($q) use ($search) {
                $q->where('item_name', 'like', $search)
                    ->orWhere('description', 'like', $search)
                    ->orWhere('location', 'like', $search);
            });
        }

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->integer('category_id'));
        }

        if ($request->filled('item_type')) {
            $query->where('item_type', $request->input('item_type'));
        }

        if ($request->filled('status')) {
            $status = $request->input('status');
            if (in_array($status, self::STATUSES, true)) {
                $query->where('item_status', $status);
            }
        }
    }
}
