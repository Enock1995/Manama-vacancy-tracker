<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    protected $fillable = [
        'user_id', 'model_type', 'model_id',
        'action', 'field_changed', 'old_value', 'new_value', 'ip_address',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}