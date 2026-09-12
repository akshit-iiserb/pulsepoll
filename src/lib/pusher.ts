import Pusher from 'pusher';

// Server-side Pusher instance — used in API routes to trigger events
export const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
});

/** Trigger a Pusher event on a room channel */
export async function triggerRoom(roomCode: string, event: string, data: unknown) {
  await pusher.trigger(`room-${roomCode.toUpperCase()}`, event, data);
}
