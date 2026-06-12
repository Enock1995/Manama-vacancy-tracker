<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Support\Facades\Auth;

class AuditService
{
    public static function log(
        string $modelType,
        int $modelId,
        string $action,
        ?string $fieldChanged = null,
        mixed $oldValue = null,
        mixed $newValue = null
    ): void {
        AuditLog::create([
            'user_id'       => Auth::id(),
            'model_type'    => $modelType,
            'model_id'      => $modelId,
            'action'        => $action,
            'field_changed' => $fieldChanged,
            'old_value'     => $oldValue !== null ? (string) $oldValue : null,
            'new_value'     => $newValue !== null ? (string) $newValue : null,
            'ip_address'    => request()->ip(),
        ]);
    }

    public static function logChanges(string $modelType, int $modelId, array $original, array $changes): void
    {
        foreach ($changes as $field => $newValue) {
            $oldValue = $original[$field] ?? null;
            if ($oldValue != $newValue) {
                self::log($modelType, $modelId, 'updated', $field, $oldValue, $newValue);
            }
        }
    }
}