<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Item extends Model
{
    protected $fillable = [
        'user_id', 'category_id', 'item_name', 'description', 'item_type',
        'location', 'lost_found_date', 'date_reported', 'item_status',
        'additional_information',
    ];

    protected function casts(): array
    {
        return ['lost_found_date' => 'date', 'date_reported' => 'datetime'];
    }

    public function user() { return $this->belongsTo(User::class); }
    public function reporter() { return $this->belongsTo(User::class, 'user_id'); }
    public function category() { return $this->belongsTo(Category::class); }
    public function images()
    {
        return $this->hasMany(ItemImage::class)->orderBy('is_primary', 'desc')->orderBy('id');
    }
    public function claims() { return $this->hasMany(Claim::class); }
}