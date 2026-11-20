<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class ItemImage extends Model
{
    use HasFactory;

    protected $fillable = ['item_id', 'path', 'is_primary'];

    protected function casts(): array
    {
        return ['is_primary' => 'boolean'];
    }

    protected $appends = ['url'];

    public function item()
    {
        return $this->belongsTo(Item::class);
    }

    public function getUrlAttribute(): string
    {
        return Storage::url($this->path);
    }
}
