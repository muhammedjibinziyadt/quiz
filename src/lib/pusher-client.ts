import PusherClient from "pusher-js";

let clientInstance: PusherClient | null = null;

export function getPusherClient(): PusherClient | null {
  if (typeof window === "undefined") {
    return null;
  }

  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "ap2";

  if (!key || key.includes("your_") || key.includes("mock_")) {
    return null;
  }

  if (!clientInstance) {
    try {
      clientInstance = new PusherClient(key, {
        cluster,
        forceTLS: true,
      });
    } catch (err) {
      console.warn("Client Pusher failed to initialize:", err);
      return null;
    }
  }

  return clientInstance;
}
