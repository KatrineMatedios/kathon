<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Auth;

/** @mixin \App\Models\Item */
class ItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'item_name' => $this->item_name,
            'description' => $this->description,
            'item_type' => $this->item_type,
            'location' => $this->location,
            'lost_found_date' => $this->lost_found_date?->toDateString(),
            'date_reported' => $this->date_reported?->toISOString(),
            'item_status' => $this->item_status,
            'additional_information' => $this->additional_information,
            'category' => $this->whenLoaded('category', fn () => $this->category ? [
                'id' => $this->category->id,
                'name' => $this->category->name,
                'icon' => $this->category->icon,
            ] : null),
            'images' => $this->whenLoaded('images', fn () => $this->images->pluck('url')->values()->all()),
            'image_url' => $this->image_url,
            'reporter' => $this->whenLoaded('user', fn () => [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'student_id' => $this->user->student_id,
                'email' => $this->user->email,
            ]),
            'is_owner' => Auth::id() === $this->user_id,
            'claims_count' => $this->whenCounted('claims'),
            'claims' => $this->whenLoaded('claims', fn () => ClaimResource::collection($this->claims)),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
