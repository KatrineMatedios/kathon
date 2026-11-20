<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Item extends Model
{
    /** @use HasFactory<\Database\Factories\ItemFactory> */
    use HasFactory;

    protected $fillable = [
        'user_id',
        'category_id',
        'item_name',
        'description',
        'item_type',
        'location',
        'lost_found_date',
        'date_reported',
        'item_status',
        'additional_information',
    ];

    protected function casts(): array
    {
        return [
            'lost_found_date' => 'date',
            'date_reported' => 'datetime',
        ];
    }

    protected $appends = ['image_url', 'image_urls'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function images()
    {
        return $this->hasMany(ItemImage::class)->orderBy('is_primary', 'desc')->orderBy('id');
    }

    public function claims()
    {
        return $this->hasMany(Claim::class);
    }

    public function getImageUrlAttribute(): ?string
    {
        $image = $this->images->first();

        return $image?->url;
    }

    public function getImageUrlsAttribute(): array
    {
        return $this->images->pluck('url')->filter()->values()->all();
    }
}
