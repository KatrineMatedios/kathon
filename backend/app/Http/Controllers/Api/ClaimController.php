<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ClaimResource;
use App\Models\Claim;
use App\Models\Item;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class ClaimController extends Controller
{
    public function index(Request $request)
    {
        $query = Claim::with(['item.user', 'claimant', 'reviewer']);

        if (! Auth::user()?->isAdmin()) {
            $query->where(function ($q) {
                $q->where('claimant_id', Auth::id())
                    ->orWhereHas('item', fn ($itemQuery) => $itemQuery->where('user_id', Auth::id()));
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        $claims = $query->orderBy('created_at', 'desc')->paginate(12)->withQueryString();

        return ClaimResource::collection($claims);
    }

    public function show(int $id)
    {
        $claim = Claim::with(['item', 'claimant', 'reviewer'])->findOrFail($id);
        $this->authorizeClaimAccess($claim);

        return new ClaimResource($claim);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'item_id' => ['required', 'exists:items,id'],
            'reason' => ['required', 'string', 'min:10'],
            'proof' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
        ]);

        $item = Item::with('user')->findOrFail($data['item_id']);

        if ($item->user_id === Auth::id()) {
            return response()->json(['message' => 'You cannot claim your own report.'], 422);
        }

        $existing = Claim::where('item_id', $item->id)
            ->where('claimant_id', Auth::id())
            ->where('status', 'pending')
            ->exists();

        if ($existing) {
            return response()->json(['message' => 'You already have a pending claim for this item.'], 422);
        }

        $proofPath = $request->hasFile('proof')
            ? $request->file('proof')->store('claims', 'public')
            : null;

        $claim = Claim::create([
            'item_id' => $item->id,
            'claimant_id' => Auth::id(),
            'reason' => $data['reason'],
            'proof_path' => $proofPath,
            'status' => 'pending',
            'verification_code' => strtoupper(Str::random(10)),
        ]);

        notify_user(
            $item->user,
            'claim_submitted',
            'New claim on your item',
            "Someone submitted a claim for {$item->item_name}. Review it in My Reports."
        );
        log_activity('claim_submitted', "Submitted claim #{$claim->id} for {$item->item_name}.", Auth::user(), Claim::class, $claim->id);

        $claim->load(['item', 'claimant']);

        return response()->json([
            'message' => 'Claim submitted successfully.',
            'claim' => new ClaimResource($claim),
        ], 201);
    }

    public function update(Request $request, int $id)
    {
        if (! Auth::user()?->isAdmin()) {
            return response()->json(['message' => 'Only administrators can review claims.'], 403);
        }

        $claim = Claim::with(['item.user', 'claimant'])->findOrFail($id);

        $data = $request->validate([
            'status' => ['required', 'in:approved,rejected'],
        ]);

        $claim->update([
            'status' => $data['status'],
            'reviewed_by' => Auth::id(),
            'reviewed_at' => now(),
        ]);

        if ($data['status'] === 'approved') {
            $claim->item()->update(['item_status' => 'returned']);
            Claim::where('item_id', $claim->item_id)
                ->where('id', '!=', $claim->id)
                ->where('status', 'pending')
                ->update([
                    'status' => 'rejected',
                    'reviewed_by' => Auth::id(),
                    'reviewed_at' => now(),
                ]);
        }

        $statusText = $data['status'] === 'approved' ? 'approved' : 'rejected';
        notify_user(
            $claim->claimant,
            'claim_'.$statusText,
            'Claim '.ucfirst($statusText),
            "Your claim for {$claim->item->item_name} has been {$statusText}."
        );
        notify_user(
            $claim->item->user,
            'claim_'.$statusText,
            'Claim '.ucfirst($statusText),
            "The claim for {$claim->item->item_name} has been {$statusText}."
        );

        log_activity('claim_'.$statusText, ucfirst($statusText)." claim #{$claim->id}.", Auth::user(), Claim::class, $claim->id);

        $claim->load(['item', 'claimant', 'reviewer']);

        return (new ClaimResource($claim))->additional(['message' => 'Claim status updated successfully.']);
    }

    public function verify(string $code)
    {
        if (! Auth::user()?->isAdmin()) {
            return response()->json(['message' => 'Only administrators can verify claims.'], 403);
        }

        $claim = Claim::with(['item.user', 'claimant', 'reviewer'])
            ->where('verification_code', strtoupper($code))
            ->firstOrFail();

        return (new ClaimResource($claim))->additional([
            'verification' => [
                'valid' => $claim->status === 'approved',
                'code' => $claim->verification_code,
                'verified_at' => now()->toISOString(),
            ],
        ]);
    }

    private function authorizeClaimAccess(Claim $claim): void
    {
        if (Auth::user()?->isAdmin() || $claim->claimant_id === Auth::id() || $claim->item->user_id === Auth::id()) {
            return;
        }

        abort(403, 'You are not allowed to view this claim.');
    }
}
