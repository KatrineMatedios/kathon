<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Claim;
use App\Models\Item;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ClaimController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $userId = $request->user()->id;

        $query = Claim::query()
            ->where(function ($builder) use ($userId) {
                $builder->where('claimant_id', $userId)
                    ->orWhereHas('item', fn ($q) => $q->where('user_id', $userId));
            })
            ->with(['item.reporter', 'claimant', 'reviewer'])
            ->latest();

        $perPage = max(1, min(100, (int) $request->query('per_page', 100)));
        $paginator = $query->paginate($perPage);
        $viewer = $request->user();

        return response()->json(paginated($paginator,
            $paginator->getCollection()->map(fn (Claim $c) => api_claim($c, $viewer))->all()
        ));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'item_id' => ['required', 'exists:items,id'],
            'reason' => ['required', 'string', 'min:10'],
            'proof' => ['nullable', 'image', 'max:5120'],
        ]);

        $item = Item::findOrFail($data['item_id']);

        $claim = Claim::create([
            'item_id' => $item->id,
            'claimant_id' => $request->user()->id,
            'reason' => $data['reason'],
            'proof_path' => $request->hasFile('proof') ? $request->file('proof')->store('proofs', 'public') : null,
            'verification_code' => verification_code(),
            'status' => 'pending',
        ]);

        if ($item->user_id !== $request->user()->id) {
            notify_user($item->user, 'new_claim', 'New claim on your item', "Someone claimed {$item->item_name}.", ['claim_id' => $claim->id, 'item_id' => $item->id]);
        }

        log_activity('claim_submitted', "Submitted a claim for {$item->item_name}.", 'claim', $claim->id, $request->user());

        return response()->json(['claim' => api_claim($claim->fresh(), $request->user())], 201);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $claim = Claim::with(['item.reporter', 'claimant', 'reviewer'])->findOrFail($id);

        return response()->json(api_claim($claim, $request->user()));
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $claim = Claim::findOrFail($id);
        abort_unless($claim->claimant_id === $request->user()->id, 403);

        $data = $request->validate(['reason' => ['sometimes', 'required', 'string', 'min:10']]);
        $claim->update($data);

        return response()->json(['message' => 'Claim updated successfully.', 'claim' => api_claim($claim->fresh(), $request->user())]);
    }

    public function verify(Request $request, string $code): JsonResponse
    {
        $claim = Claim::with(['item.reporter', 'claimant', 'reviewer'])
            ->where('verification_code', strtoupper($code))
            ->first();

        if (! $claim) {
            return response()->json(['message' => 'Invalid verification code.'], 404);
        }

        if (! $claim->verified_at) {
            $claim->update(['verified_at' => now()]);
            $claim->refresh();

            notify_user($claim->claimant, 'claim_verified', 'Claim verified', "Your claim for {$claim->item?->item_name} was verified.", ['claim_id' => $claim->id]);
        }

        return response()->json(array_merge(api_claim($claim, $request->user()), [
            'verification' => [
                'valid' => true,
                'verified_at' => $claim->verified_at?->toISOString(),
            ],
        ]));
    }
}