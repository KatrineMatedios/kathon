<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class ProfileController extends Controller
{
    public function show()
    {
        return response()->json(['user' => new UserResource(Auth::user())]);
    }

    public function update(Request $request)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        $rules = [
            'name' => ['required', 'string', 'max:120'],
            'phone' => ['nullable', 'string', 'max:30'],
            'email' => ['required', 'email:rfc', 'max:150', Rule::unique('users', 'email')->ignore($user->id)],
            'profile_photo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
        ];

        if ($request->filled('student_id')) {
            if (! $user->isAdmin()) {
                return response()->json(['message' => 'Only an administrator can change a student ID.'], 403);
            }

            $rules['student_id'] = ['required', 'string', 'max:50', Rule::unique('users', 'student_id')->ignore($user->id)];
        }

        $data = $request->validate($rules);
        unset($data['profile_photo']);

        $emailChanged = strtolower($data['email']) !== $user->email;
        $data['email'] = strtolower($data['email']);

        if (isset($data['student_id'])) {
            $data['student_id'] = strtoupper($data['student_id']);
        }

        if ($emailChanged) {
            $data['email_verified_at'] = null;
        }

        if ($request->hasFile('profile_photo')) {
            if ($user->profile_photo_path) {
                Storage::disk('public')->delete($user->profile_photo_path);
            }

            $data['profile_photo_path'] = $request->file('profile_photo')->store('profiles', 'public');
        }

        $user->update($data);
        $user->refresh();

        $response = [
            'message' => 'Profile updated successfully.',
            'user' => new UserResource($user),
        ];

        if ($emailChanged) {
            $code = strtoupper(Str::random(6));
            Cache::put('email_verification_'.$user->id, $code, now()->addMinutes(30));
            notify_user($user, 'email_verification', 'Verify your new email', "Use code {$code} to verify your new email address.");
            $response['verification_code'] = $code;
            $response['email_verification_required'] = true;
        }

        log_activity('profile_updated', 'Updated account profile.', $user);

        return response()->json($response);
    }

    public function sendVerificationCode()
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        $code = strtoupper(Str::random(6));
        Cache::put('email_verification_'.$user->id, $code, now()->addMinutes(30));
        notify_user($user, 'email_verification', 'Verify your email', "Use code {$code} to verify your email address.");

        log_activity('verification_sent', 'Requested an email verification code.', $user);

        return response()->json([
            'message' => 'Verification code sent.',
            'verification_code' => $code,
        ]);
    }

    public function verifyEmail(Request $request)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        $request->validate(['code' => ['required', 'string', 'size:6']]);

        $cached = Cache::get('email_verification_'.$user->id);

        if (! $cached || strtoupper($request->code) !== $cached) {
            return response()->json(['message' => 'The verification code is invalid or has expired.'], 422);
        }

        $user->forceFill(['email_verified_at' => now()])->save();
        Cache::forget('email_verification_'.$user->id);
        log_activity('email_verified', 'Verified email address.', $user);

        return response()->json([
            'message' => 'Email verified successfully.',
            'user' => new UserResource($user),
        ]);
    }
}
