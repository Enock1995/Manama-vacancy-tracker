<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Cadre extends Model
{
    protected $fillable = ['name', 'category', 'is_active'];

    protected $casts = ['is_active' => 'boolean'];

    public function vacantPosts()
    {
        return $this->hasMany(VacantPost::class);
    }
}