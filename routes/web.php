<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
| All non-API routes fall through to the React SPA so that React Router
| handles client-side navigation (Dashboard, Posts, Users, etc.).
|
| The Laravel API is registered separately in routes/api.php under /api.
|--------------------------------------------------------------------------
*/

Route::fallback(function () {
    $spa = public_path('index.html');

    if (file_exists($spa)) {
        return response()->file($spa);
    }

    // Shown only if the React build has not been copied to public/ yet
    return response('<h2 style="font-family:sans-serif;padding:2rem">
        MatSouth Vacancy Tracker — frontend build not found.<br>
        <small>Run: npm run build --prefix frontend && cp -r frontend/dist/* public/</small>
    </h2>', 404);
});