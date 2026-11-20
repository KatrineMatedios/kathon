<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name', 'student_id', 'email', 'password', 'phone',
        'profile_photo_path', 'role', 'is_active', 'email_verified_at',
    ];

    protected $hidden = ['password', 'remember_token'];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
        ];
    }

    public function items() { return $this->hasMany(Item::class); }
    public function claims() { return $this->hasMany(Claim::class, 'claimant_id'); }
    public function notifications() { return $this->hasMany(Notification::class); }
    public function activityLogs() { return $this->hasMany(ActivityLog::class); }
}