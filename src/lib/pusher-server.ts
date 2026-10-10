import Pusher from "pusher";

let pusherServerInstance: Pusher | null = null;

export function getPusherServer(): Pusher | null {
  const appId = process.env.PUSHER_APP_ID;
  const key = process.env.PUSHER_KEY;
  const secret = process.env.PUSHER_SECRET;
  const cluster = process.env.PUSHER_CLUSTER || "ap2";

  if (!appId || !key || !secret || key.includes("your_") || appId.includes("mock_")) {
    return null;
  }

  if (!pusherServerInstance) {
    try {
      pusherServerInstance = new Pusher({
        appId,
        key,
        secret,
        cluster,
        useTLS: true,
      });
    } catch (err) {
      console.warn("Failed to initialize Pusher server:", err);
      return null;
    }
  }

  return pusherServerInstance;
}

/**
 * Publishes real-time leaderboard update safely.
 * Non-blocking: will never crash or disrupt a quiz submission if Pusher is offline.
 */
export async function broadcastLeaderboardUpdate(
  quizId: string,
  eventData: {
    quizId: string;
    updatedAt: string;
    totalParticipants: number;
    leaderboard: unknown[];
  }
): Promise<boolean> {
  const pusher = getPusherServer();
  if (!pusher) {
    // Graceful no-op when Pusher is not configured in local environment
    return false;
  }

  try {
    const channelName = `admin-leaderboard-${quizId}`;
    await pusher.trigger(channelName, "ranking-updated", eventData);
    console.log(`[Pusher] Broadcasted ranking-updated to channel: ${channelName}`);
    return true;
  } catch (error) {
    console.error("[Pusher] Broadcast error (submission preserved):", error);
    return false;
  }
}
