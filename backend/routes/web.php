<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    $file = public_path('index.html');

    if (! file_exists($file)) {
        abort(404);
    }

    return response()->file($file);
});

// Serve the built React SPA for client-side routes such as /home, /browse,
// /admin, etc. API and Sanctum routes are matched before this fallback.
Route::fallback(function (Request $request) {
    if ($request->is('api/*') || $request->is('sanctum/*')) {
        abort(404);
    }

    $file = public_path('index.html');

    if (! file_exists($file)) {
        abort(404);
    }

    return response()->file($file);
});
