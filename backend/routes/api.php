<?php

use App\Http\Controllers\Api\ActivityController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\ClaimController;
use App\Http\Controllers\Api\ItemController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\SupportController;
use Illuminate\Support\Facades\Route;

Route::get('/categories', [CategoryController::class, 'index']);

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:10,1');
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);
Route::post('/dev/reset-token', [AuthController::class, 'developmentResetToken']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);

    Route::get('/items', [ItemController::class, 'index']);
    Route::post('/items', [ItemController::class, 'store']);
    Route::get('/items/{id}', [ItemController::class, 'show'])->whereNumber('id');
    Route::put('/items/{id}', [ItemController::class, 'update'])->whereNumber('id');
    Route::delete('/items/{id}', [ItemController::class, 'destroy'])->whereNumber('id');

    Route::get('/my-reports', [ItemController::class, 'myReports']);
    Route::post('/reports/lost', [ItemController::class, 'reportLost']);
    Route::post('/reports/found', [ItemController::class, 'reportFound']);

    Route::get('/claims', [ClaimController::class, 'index']);
    Route::post('/claims', [ClaimController::class, 'store']);
    Route::get('/claims/verify/{code}', [ClaimController::class, 'verify']);
    Route::get('/claims/{id}', [ClaimController::class, 'show'])->whereNumber('id');
    Route::put('/claims/{id}', [ClaimController::class, 'update'])->whereNumber('id');

    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::put('/notifications/read-all', [NotificationController::class, 'markAllRead']);
    Route::put('/notifications/{id}/read', [NotificationController::class, 'markRead'])->whereNumber('id');

    Route::get('/profile', [ProfileController::class, 'show']);
    Route::put('/profile', [ProfileController::class, 'update']);
    Route::post('/profile/email/code', [ProfileController::class, 'sendVerificationCode']);
    Route::post('/profile/email/verify', [ProfileController::class, 'verifyEmail']);

    Route::get('/activity', [ActivityController::class, 'index']);
    Route::get('/support-tickets', [SupportController::class, 'index']);
    Route::post('/support-tickets', [SupportController::class, 'store']);

    Route::middleware('role:admin')->prefix('admin')->group(function () {
        Route::get('/dashboard', [AdminController::class, 'dashboard']);
        Route::get('/users', [AdminController::class, 'users']);
        Route::put('/users/{id}/status', [AdminController::class, 'updateUserStatus'])->whereNumber('id');

        Route::get('/reports', [AdminController::class, 'reports']);
        Route::put('/reports/{id}/status', [AdminController::class, 'updateReportStatus'])->whereNumber('id');
        Route::delete('/reports/{id}', [AdminController::class, 'deleteReport'])->whereNumber('id');

        Route::get('/claims', [AdminController::class, 'claims']);
        Route::put('/claims/{id}/status', [AdminController::class, 'updateClaimStatus'])->whereNumber('id');

        Route::get('/categories', [CategoryController::class, 'index']);
        Route::post('/categories', [CategoryController::class, 'store']);
        Route::put('/categories/{id}', [CategoryController::class, 'update'])->whereNumber('id');
        Route::delete('/categories/{id}', [CategoryController::class, 'destroy'])->whereNumber('id');

        Route::get('/activity', [AdminController::class, 'activityLogs']);
        Route::get('/support-tickets', [AdminController::class, 'supportTickets']);
        Route::put('/support-tickets/{id}', [AdminController::class, 'respondTicket'])->whereNumber('id');
    });
});
