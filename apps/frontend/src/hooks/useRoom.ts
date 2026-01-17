import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  Card,
  Column,
  ConnectionStatus,
  RoomActions,
  RoomMeta,
  RoomState,
} from '../types/room';

interface SyncMessage {
  type: 'sync';
  data: {
    meta: RoomMeta | null;
    columns: Column[];
    cards: Card[];
    isAdmin: boolean;
  };
}

interface UseRoomOptions {
  roomId: string;
  token?: string | null;
}

interface UseRoomResult {
  state: RoomState;
  status: ConnectionStatus;
  actions: RoomActions;
}

export function useRoom({ roomId, token }: UseRoomOptions): UseRoomResult {
  const [state, setState] = useState<RoomState>({
    meta: null,
    columns: [],
    cards: [],
    isAdmin: false,
  });
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const reconnectAttemptRef = useRef(0);
  const isCleaningUpRef = useRef(false);

  // Exponential backoff: 1s, 2s, 4s, 8s, max 30s
  const getReconnectDelay = (): number => {
    const baseDelay = 1000;
    const maxDelay = 30000;
    const delay = Math.min(baseDelay * Math.pow(2, reconnectAttemptRef.current), maxDelay);
    return delay;
  };

  const connect = useCallback((): void => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    const params = token ? `?token=${encodeURIComponent(token)}` : '';
    let url: string;

    // In development, connect directly to the worker since Vite's proxy doesn't handle WebSocket upgrades well
    if (import.meta.env.DEV) {
      url = `ws://localhost:8787/api/rooms/${roomId}/ws${params}`;
    } else {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      url = `${protocol}//${host}/api/rooms/${roomId}/ws${params}`;
    }

    setStatus('connecting');
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = (): void => {
      // Ignore if this WebSocket is no longer current (StrictMode cleanup race)
      if (wsRef.current !== ws) {
        ws.close();
        return;
      }
      setStatus('connected');
      reconnectAttemptRef.current = 0; // Reset backoff on successful connection
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };

    ws.onmessage = (event: MessageEvent): void => {
      // Ignore if this WebSocket is no longer current
      if (wsRef.current !== ws) {
        return;
      }
      try {
        const message = JSON.parse(event.data as string) as SyncMessage;
        if (message.type === 'sync') {
          setState({
            meta: message.data.meta,
            columns: message.data.columns,
            cards: message.data.cards,
            isAdmin: message.data.isAdmin,
          });
        }
      } catch {
        // Ignore invalid messages
      }
    };

    ws.onclose = (): void => {
      // Ignore if this WebSocket is no longer current or we're cleaning up
      if (wsRef.current !== ws || isCleaningUpRef.current) {
        return;
      }
      setStatus('disconnected');
      wsRef.current = null;
      // Attempt reconnect with exponential backoff
      const delay = getReconnectDelay();
      reconnectAttemptRef.current += 1;
      reconnectTimeoutRef.current = window.setTimeout(() => {
        connect();
      }, delay);
    };

    ws.onerror = (): void => {
      // Ignore if this WebSocket is no longer current
      if (wsRef.current !== ws) {
        return;
      }
      setStatus('error');
    };
  }, [roomId, token]);

  useEffect(() => {
    isCleaningUpRef.current = false;
    connect();

    return (): void => {
      isCleaningUpRef.current = true;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);

  const send = useCallback((type: string, data: Record<string, unknown>): void => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, data }));
    }
  }, []);

  const actions: RoomActions = {
    addCard: useCallback(
      (columnId: string, text: string): void => {
        send('card:add', { columnId, text });
      },
      [send]
    ),
    updateCard: useCallback(
      (id: string, text: string): void => {
        send('card:update', { id, text });
      },
      [send]
    ),
    deleteCard: useCallback(
      (id: string): void => {
        send('card:delete', { id });
      },
      [send]
    ),
    publishCard: useCallback(
      (id: string): void => {
        send('card:publish', { id });
      },
      [send]
    ),
    publishAllCards: useCallback(
      (columnId: string): void => {
        send('card:publish-all', { columnId });
      },
      [send]
    ),
    addColumn: useCallback(
      (name: string, description: string): void => {
        send('column:add', { name, description });
      },
      [send]
    ),
    updateColumn: useCallback(
      (id: string, name: string, description: string): void => {
        send('column:update', { id, name, description });
      },
      [send]
    ),
    deleteColumn: useCallback(
      (id: string): void => {
        send('column:delete', { id });
      },
      [send]
    ),
    reorderColumn: useCallback(
      (id: string, newPosition: number): void => {
        send('column:reorder', { id, newPosition });
      },
      [send]
    ),
  };

  return { state, status, actions };
}
