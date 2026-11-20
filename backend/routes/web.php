<?php

use Illuminate\Support\Facades\Route;

// Serve the built React SPA (copied into public/ by the Docker image) for all
// non-API routes so client-side routing works on refresh.
Route::get('/{any?}', function () {
    $index = public_path('index.html');

    if (is_file($index)) {
        return response()->file($index);
    }

    return view('welcome');
})->where('any', '.*');
