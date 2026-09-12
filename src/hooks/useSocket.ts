'use client';

/**
 * usePusher — Drop-in replacement for the old useSocket (Socket.IO) hook.
 *
 * Exposes the same { isConnected, emit, on, off } interface so all page
 * components work without changes.
 *
 * `emit` sends a POST to /api/socket/<event-path> instead of a WS frame.
 * `on`   subscribes to a Pusher Channels event on the room channel.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import PusherClient from 'pusher-js';
import type { ServerToClientEvents, ClientToServerEvents } from '@/lib/types';

// Map socket event names → API route paths
const EVENT_TO_PATH: Partial<Record<keyof ClientToServerEvents, string>> = {
  'room:join':         '/api/socket/room/join',
  'poll:create':       '/api/socket/poll/create',
  'poll:vote':         '/api/socket/poll/vote',
  'poll:word:submit':  '/api/socket/poll/word',
  'poll:setState':     '/api/socket/poll/state',
  'poll:delete':       '/api/socket/poll/delete',
  'qa:submit':         '/api/socket/qa/submit',
  'qa:upvote':         '/api/socket/qa/upvote',
  'qa:moderate':       '/api/socket/qa/moderate',
  'qa:getPending':     '/api/socket/qa/pending',
  'quiz:create':       '/api/socket/quiz/create',
  'quiz:start':        '/api/socket/quiz/start',
  'quiz:answer':       '/api/socket/quiz/answer',
  'quiz:next':         '/api/socket/quiz/next',
  'quiz:end':          '/api/socket/quiz/end',
};

let globalPusher: PusherClient | null = null;
// roomCode → channel
const channels = new Map<string, ReturnType<PusherClient['subscribe']>>();

function getPusher() {
  if (!globalPusher) {
    globalPusher = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });
  }
  return globalPusher;
}

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const channelRef = useRef<ReturnType<PusherClient['subscribe']> | null>(null);
  // Store room code so we can subscribe after join
  const roomCodeRef = useRef<string | null>(null);

  useEffect(() => {
    const p = getPusher();
    p.connection.bind('connected', () => setIsConnected(true));
    p.connection.bind('disconnected', () => setIsConnected(false));
    p.connection.bind('error', () => setIsConnected(false));
    if (p.connection.state === 'connected') setIsConnected(true);

    return () => {
      p.connection.unbind('connected');
      p.connection.unbind('disconnected');
      p.connection.unbind('error');
    };
  }, []);

  /** Subscribe to the room's Pusher channel (called after room:join) */
  const subscribeToRoom = useCallback((roomCode: string) => {
    const channelName = `room-${roomCode.toUpperCase()}`;
    if (!channels.has(channelName)) {
      const ch = getPusher().subscribe(channelName);
      channels.set(channelName, ch);
    }
    channelRef.current = channels.get(channelName)!;
    roomCodeRef.current = roomCode.toUpperCase();
  }, []);

  const emit = useCallback(
    async <E extends keyof ClientToServerEvents>(
      event: E,
      ...args: Parameters<ClientToServerEvents[E]>
    ): Promise<any> => {
      const path = EVENT_TO_PATH[event];
      if (!path) {
        console.warn(`[usePusher] No API path for event: ${event}`);
        return;
      }
      const body = args[0] as Record<string, unknown>;

      // Subscribe to the room channel as soon as we know the roomCode
      if (event === 'room:join' && body.roomCode) {
        subscribeToRoom(body.roomCode as string);
      }

      try {
        const res = await fetch(path, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const json = await res.json().catch(() => ({}));

        // For room:join the server returns the full RoomState — emit it locally
        if (event === 'room:join' && json?.room) {
          channelRef.current?.emit('room:joined', json);
        }

        // Propagate server-returned errors as an 'error' event
        if (json?.error) {
          channelRef.current?.emit('error', json.error);
        }

        return json;
      } catch (err) {
        console.error(`[usePusher] fetch ${path} failed:`, err);
      }
    },
    [subscribeToRoom]
  );

  const on = useCallback(
    <E extends keyof ServerToClientEvents>(event: E, listener: ServerToClientEvents[E]) => {
      // room:joined is emitted locally (from emit above), bind on channel object
      const ch = channelRef.current;
      if (ch) {
        (ch as any).bind(event, listener);
        return () => (ch as any).unbind(event, listener);
      }
      // Listener registered before channel is ready: defer
      let unbound = false;
      const tryBind = () => {
        const channel = channelRef.current;
        if (channel && !unbound) {
          (channel as any).bind(event, listener);
        }
      };
      // Poll briefly for channel availability (max 2s)
      const timers: ReturnType<typeof setTimeout>[] = [];
      [50, 200, 500, 1000, 2000].forEach((ms) => {
        timers.push(setTimeout(tryBind, ms));
      });
      return () => {
        unbound = true;
        timers.forEach(clearTimeout);
        (channelRef.current as any)?.unbind(event, listener);
      };
    },
    []
  );

  const off = useCallback(
    <E extends keyof ServerToClientEvents>(event: E, listener?: ServerToClientEvents[E]) => {
      (channelRef.current as any)?.unbind(event, listener);
    },
    []
  );

  return { socket: null, isConnected, emit, on, off };
}
