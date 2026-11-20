<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SupportTicket;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SupportController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $tickets = SupportTicket::where('user_id', $request->user()->id)
            ->with('user')->latest()->get()
            ->map(fn (SupportTicket $t) => api_ticket($t))->values();

        return response()->json(['data' => $tickets]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'subject' => ['required', 'string', 'max:255'],
            'message' => ['required', 'string'],
        ]);

        $ticket = SupportTicket::create([
            'user_id' => $request->user()->id,
            'subject' => $data['subject'],
            'message' => $data['message'],
        ]);

        log_activity('support_requested', "Submitted support request: {$ticket->subject}.", 'support_ticket', $ticket->id, $request->user());

        return response()->json(['message' => 'Support request submitted successfully.', 'ticket' => api_ticket($ticket)], 201);
    }
}