<?php

namespace App\Http\Controllers\Notification;

use App\Http\Controllers\Controller;
use App\Http\Requests\Notification\ListNotificationsRequest;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function __construct(private NotificationService $notifications) {}

    public function index(ListNotificationsRequest $request): JsonResponse
    {
        return response()->json($this->notifications->list($request->user(), $request->boolean('unread'), $request->integer('page', 1)))
            ->header('Cache-Control', 'private, no-store');
    }

    public function summary(Request $request): JsonResponse
    {
        return response()->json($this->notifications->summary($request->user()))->header('Cache-Control', 'private, no-store');
    }

    public function read(Request $request, string $id): JsonResponse
    {
        $this->notifications->markRead($request->user(), $id);

        return response()->json(['message' => 'Notifikasi ditandai dibaca.']);
    }

    public function readAll(Request $request): JsonResponse
    {
        $this->notifications->markAllRead($request->user());

        return response()->json(['message' => 'Semua notifikasi ditandai dibaca.']);
    }
}
