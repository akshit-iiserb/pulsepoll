'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type { ServerToClientEvents, ClientToServerEvents } from '@/lib/types';

type SocketType = Socket<ServerToClientEvents, ClientToServerEvents>;

let globalSocket: SocketType | null = null;

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<SocketType | null>(null);

  useEffect(() => {
    // Reuse existing socket connection if available
    if (!globalSocket || globalSocket.disconnected) {
      globalSocket = io({
        path: '/socket.io',
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });
    }

    socketRef.current = globalSocket;

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    globalSocket.on('connect', onConnect);
    globalSocket.on('disconnect', onDisconnect);

    if (globalSocket.connected) setIsConnected(true);

    return () => {
      globalSocket?.off('connect', onConnect);
      globalSocket?.off('disconnect', onDisconnect);
    };
  }, []);

  const emit = useCallback(
    <E extends keyof ClientToServerEvents>(
      event: E,
      ...args: Parameters<ClientToServerEvents[E]>
    ) => {
      socketRef.current?.emit(event, ...args);
    },
    []
  );

  const on = useCallback(
    <E extends keyof ServerToClientEvents>(event: E, listener: ServerToClientEvents[E]) => {
      (socketRef.current as any)?.on(event, listener);
      return () => {
        (socketRef.current as any)?.off(event, listener);
      };
    },
    []
  );

  const off = useCallback(
    <E extends keyof ServerToClientEvents>(event: E, listener?: ServerToClientEvents[E]) => {
      (socketRef.current as any)?.off(event, listener);
    },
    []
  );

  return { socket: socketRef.current, isConnected, emit, on, off };
}
