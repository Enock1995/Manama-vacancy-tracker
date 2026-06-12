<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Facility extends Model
{
    protected $fillable = [
        'district_id', 'name', 'code', 'facility_type',
        'ownership', 'level_of_care', 'is_active',
    ];

    protected $casts = ['is_active' => 'boolean'];

    public function district()
    {
        return $this->belongsTo(District::class);
    }

    public function vacantPosts()
    {
        return $this->hasMany(VacantPost::class);
    }

    public function users()
    {
        return $this->hasMany(User::class);
    }
}