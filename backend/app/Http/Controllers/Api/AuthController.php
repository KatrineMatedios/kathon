<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'student_id' => ['required', 'string', 'max:50', 'unique:users,student_id'],
            'email' => ['required', 'email:rfc', 'max:150', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $user = User::create([
            'name' => $data['name'],
            'student_id' => strtoupper($data['student_id']),
            'email' => strtolower($data['email']),
            'password' => $data['password'],
            'role' => 'student',
            'is_active' => true,
        ]);

        Auth::login($user);
        $request->session()->regenerate();

        notify_user(
            $user,
            'account_created',
            'Welcome to CampusFind!',
            'Your account is ready. You can now report and browse lost items.'
        );
        log_activity('registered', 'Created a new student account.', $user, User::class, $user->id);

        return response()->json([
            'message' => 'Account created successfully.',
            'user' => new UserResource($user),
        ], 201);
    }

    public function login(Request $request)
    {
        $credentials = $request->validate([
            'login' => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);

        $field = filter_var($credentials['login'], FILTER_VALIDATE_EMAIL) ? 'email' : 'student_id';
        $attempt = [
            $field => $field === 'student_id' ? strtoupper($credentials['login']) : strtolower($credentials['login']),
            'password' => $credentials['password'],
        ];

        if (! Auth::attempt($attempt)) {
            return response()->json(['message' => 'Invalid email/student ID or password.'], 422);
        }

        /** @var User $user */
        $user = Auth::user();

        if (! $user->is_active) {
            Auth::logout();
            $request->session()->invalidate();

            return response()->json(['message' => 'This account has been deactivated. Please contact support.'], 403);
        }

        $request->session()->regenerate();
        log_activity('logged_in', 'Signed in to CampusFind.', $user);

        return response()->json([
            'message' => 'Signed in successfully.',
            'user' => new UserResource($user),
        ]);
    }

    public function logout(Request $request)
    {
        if (Auth::check()) {
            log_activity('logged_out', 'Signed out of CampusFind.', Auth::user());
        }

        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['message' => 'Signed out successfully.']);
    }

    public function user(Request $request)
    {
        return response()->json(['user' => new UserResource($request->user())]);
    }

    public function forgotPassword(Request $request)
    {
        $request->validate(['email' => ['required', 'email']]);

        $status = Password::broker()->sendResetLink($request->only('email'));

        if ($status === Password::RESET_LINK_SENT) {
            return response()->json(['message' => 'Password reset instructions have been sent.']);
        }

        return response()->json(['message' => 'We could not send a reset link to that email address.'], 422);
    }

    public function resetPassword(Request $request)
    {
        $request->validate([
            'token' => ['required', 'string'],
            'email' => ['required', 'email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $status = Password::broker()->reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (User $user, string $password) {
                $user->forceFill(['password' => Hash::make($password)])->save();
                $user->tokens()->delete();
                log_activity('password_reset', 'Reset account password.', $user);
            }
        );

        if ($status === Password::PASSWORD_RESET) {
            return response()->json(['message' => 'Password reset successfully. Please sign in.']);
        }

        return response()->json(['message' => 'This password reset token is invalid or has expired.'], 422);
    }

    /**
     * Local development helper: returns a reset token without sending email.
     * Remove or protect this endpoint in production.
     */
    public function developmentResetToken(Request $request)
    {
        $request->validate(['email' => ['required', 'email']]);

        $user = User::where('email', strtolower($request->email))->first();

        if (! $user) {
            return response()->json(['message' => 'No account found with that email.'], 404);
        }

        return response()->json([
            'message' => 'Development reset token generated.',
            'token' => Password::broker()->createToken($user),
            'email' => $user->email,
        ]);
    }
}
