<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class ProfileController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        return response()->json(['user' => api_user($request->user())]);
    }

    public function update(Request $request): JsonResponse
    {
        $user = $request->user();

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email,'.$user->id],
            'phone' => ['nullable', 'string', 'max:50'],
            'student_id' => ['nullable', 'string', 'max:100', 'unique:users,student_id,'.$user->id],
            'profile_photo' => ['nullable', 'image', 'max:5120'],
        ]);

        $emailChanged = strtolower($data['email']) !== strtolower($user->email);

        $user->name = $data['name'];
        $user->phone = $data['phone'] ?? null;
        if ($request->has('student_id')) {
            $user->student_id = $data['student_id'] ?: null;
        }
        if (! $emailChanged) {
            $user->email = $data['email'];
        }
        if ($request->hasFile('profile_photo')) {
            if ($user->profile_photo_path) {
                Storage::disk('public')->delete($user->profile_photo_path);
            }
            $user->profile_photo_path = $request->file('profile_photo')->store('profiles', 'public');
        }
        $user->save();

        log_activity('profile_updated', 'Updated personal information.', 'user', $user->id, $user);

        $response = ['message' => 'Profile updated successfully.', 'user' => api_user($user->fresh())];

        if ($emailChanged) {
            $code = $this->issueCode($user, $data['email']);
            $response['email_verification_required'] = true;
            $response['verification_code'] = $code;
            $response['message'] = 'Profile updated. Verify your new email address with the code below.';
        }

        return response()->json($response);
    }

    public function sendVerificationCode(Request $request): JsonResponse
    {
        return response()->json(['verification_code' => $this->issueCode($request->user(), $request->user()->email)]);
    }

    public function verifyEmail(Request $request): JsonResponse
    {
        $data = $request->validate(['code' => ['required', 'string']]);
        $user = $request->user();

        $expected = cache('email-code-'.$user->id);
        if (! $expected || ! Hash::check(strtoupper($data['code']), $expected['hash'])) {
            return response()->json([
                'message' => 'The verification code is invalid or has expired.',
                'errors' => ['code' => ['The verification code is invalid or has expired.']],
            ], 422);
        }

        cache()->forget('email-code-'.$user->id);
        $user->email = $expected['email'];
        $user->email_verified_at = now();
        $user->save();

        log_activity('email_verified', 'Verified email address.', 'user', $user->id, $user);

        return response()->json([
            'message' => 'Email verified successfully.',
            'user' => api_user($user->fresh()),
        ]);
    }

    private function issueCode($user, string $email): string
    {
        $code = strtoupper(substr(str_shuffle('ABCDEFGHJKLMNPQRSTUVWXYZ23456789'), 0, 6));
        cache(['email-code-'.$user->id => [
            'email' => $email,
            'hash' => Hash::make($code),
        ]], now()->addMinutes(30));

        return $code;
    }
}