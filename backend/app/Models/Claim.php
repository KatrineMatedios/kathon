<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Claim extends Model
{
    protected $fillable = [
        'item_id', 'claimant_id', 'reason', 'proof_path', 'status',
        'verification_code', 'verified_at', 'reviewed_by', 'reviewed_at',
    ];

    protected function casts(): array
    {
        return ['verified_at' => 'datetime', 'reviewed_at' => 'datetime'];
    }

    public function item() { return $this->belongsTo(Item::class); }
    public function claimant() { return $this->belongsTo(User::class, 'claimant_id'); }
    public function reviewer() { return $this->belongsTo(User::class, 'reviewed_by'); }
}