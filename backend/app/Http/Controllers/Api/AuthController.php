<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'student_id' => ['nullable', 'string', 'max:100', 'unique:users,student_id'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $user = User::create([
            'name' => $data['name'],
            'student_id' => $data['student_id'],
            'email' => $data['email'],
            'password' => $data['password'],
            'role' => 'student',
            'is_active' => true,
        ]);

        Auth::login($user);
        $request->session()->regenerate();

        log_activity('registered', 'Created a new student account.', 'user', $user->id, $user);

        return response()->json(['user' => api_user($user)], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'login' => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);

        $login = trim($data['login']);
        $field = filter_var($login, FILTER_VALIDATE_EMAIL) ? 'email' : 'student_id';

        if (! Auth::attempt([$field => $login, 'password' => $data['password']])) {
            return response()->json(['message' => 'The provided credentials are incorrect.'], 422);
        }

        $user = Auth::user();

        if (! $user->is_active) {
            Auth::logout();
            return response()->json(['message' => 'This account has been deactivated.'], 403);
        }

        $request->session()->regenerate();

        log_activity('logged_in', 'Signed in successfully.', 'user', $user->id, $user);

        return response()->json(['user' => api_user($user)]);
    }

    public function user(Request $request): JsonResponse
    {
        return response()->json(['user' => api_user($request->user())]);
    }

    public function logout(Request $request): JsonResponse
    {
        log_activity('logged_out', 'Signed out.', 'user', $request->user()?->id, $request->user());

        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['message' => 'Logged out successfully.']);
    }

    public function forgotPassword(Request $request): JsonResponse
    {
        $data = $request->validate(['email' => ['required', 'email']]);
        $user = User::where('email', $data['email'])->first();

        if ($user) {
            DB::table('password_reset_tokens')->updateOrInsert(
                ['email' => $user->email],
                ['token' => Hash::make(Str::random(60)), 'created_at' => now()]
            );
        }

        return response()->json(['message' => 'If the email exists, a reset token has been created.']);
    }

    public function developmentResetToken(Request $request): JsonResponse
    {
        $data = $request->validate(['email' => ['required', 'email']]);
        $row = DB::table('password_reset_tokens')->where('email', $data['email'])->first();

        if (! $row) {
            return response()->json(['message' => 'No reset token found for this email.'], 404);
        }

        return response()->json(['token' => $row->token, 'email' => $data['email']]);
    }

    public function resetPassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'token' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $row = DB::table('password_reset_tokens')->where('email', $data['email'])->first();

        if (! $row || ! Hash::check($data['token'], $row->token)) {
            return response()->json([
                'message' => 'The reset token is invalid.',
                'errors' => ['token' => ['The reset token is invalid or has expired.']],
            ], 422);
        }

        $user = User::where('email', $data['email'])->firstOrFail();
        $user->update(['password' => $data['password']]);
        DB::table('password_reset_tokens')->where('email', $data['email'])->delete();

        log_activity('password_reset', 'Reset account password.', 'user', $user->id, $user);

        return response()->json(['message' => 'Password reset successfully.']);
    }
}