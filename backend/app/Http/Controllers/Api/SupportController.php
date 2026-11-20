<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\SupportTicketResource;
use App\Models\SupportTicket;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class SupportController extends Controller
{
    public function index()
    {
        $tickets = Auth::user()->supportTickets()
            ->orderBy('created_at', 'desc')
            ->paginate(20)
            ->withQueryString();

        return SupportTicketResource::collection($tickets);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'subject' => ['required', 'string', 'max:150'],
            'message' => ['required', 'string', 'min:10'],
        ]);

        $ticket = Auth::user()->supportTickets()->create($data);
        $ticket->load('user');

        notify_user(
            Auth::user(),
            'support_ticket_created',
            'Support request received',
            "Your support request “{$ticket->subject}” has been received."
        );
        log_activity('support_requested', "Submitted support request: {$ticket->subject}.", Auth::user(), SupportTicket::class, $ticket->id);

        return (new SupportTicketResource($ticket))->additional(['message' => 'Support request submitted successfully.']);
    }
}
