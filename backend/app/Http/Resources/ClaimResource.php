<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Auth;

/** @mixin \App\Models\Claim */
class ClaimResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'item_id' => $this->item_id,
            'reason' => $this->reason,
            'proof_url' => $this->proof_url,
            'status' => $this->status,
            'verification_code' => $this->verification_code,
            'reviewed_at' => $this->reviewed_at?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
            'is_mine' => Auth::id() === $this->claimant_id,
            'item' => $this->whenLoaded('item', fn () => [
                'id' => $this->item->id,
                'item_name' => $this->item->item_name,
                'item_type' => $this->item->item_type,
                'image_url' => $this->item->image_url,
                'location' => $this->item->location,
                'item_status' => $this->item->item_status,
            ]),
            'claimant' => $this->whenLoaded('claimant', fn () => [
                'id' => $this->claimant->id,
                'name' => $this->claimant->name,
                'student_id' => $this->claimant->student_id,
                'email' => $this->claimant->email,
            ]),
            'reviewer' => $this->whenLoaded('reviewer', fn () => $this->reviewer ? [
                'id' => $this->reviewer->id,
                'name' => $this->reviewer->name,
            ] : null),
        ];
    }
}
