import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRoom } from './useRoom';

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  url: string;
  readyState: number = MockWebSocket.CONNECTING;
  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onerror: (() => void) | null = null;

  constructor(url: string) {
    this.url = url;
    // Simulate async connection
    setTimeout(() => {
      if (this.readyState !== MockWebSocket.CLOSED) {
        this.readyState = MockWebSocket.OPEN;
        this.onopen?.();
      }
    }, 10);
  }

  send = vi.fn();
  close = vi.fn(() => {
    this.readyState = MockWebSocket.CLOSED;
  });

  // Helper to simulate receiving a message
  simulateMessage(data: unknown): void {
    this.onmessage?.({ data: JSON.stringify(data) });
  }

  // Helper to simulate connection close
  simulateClose(): void {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.();
  }
}

describe('useRoom', () => {
  let originalWebSocket: typeof WebSocket;
  let mockWebSocketInstances: MockWebSocket[] = [];

  beforeEach(() => {
    vi.useFakeTimers();
    originalWebSocket = window.WebSocket;
    mockWebSocketInstances = [];

    // @ts-expect-error - Mocking WebSocket
    window.WebSocket = class extends MockWebSocket {
      constructor(url: string) {
        super(url);
        mockWebSocketInstances.push(this);
      }
    };
  });

  afterEach(() => {
    vi.useRealTimers();
    window.WebSocket = originalWebSocket;
  });

  it('connects to WebSocket with correct URL', () => {
    renderHook(() => useRoom({ roomId: 'test-room-123' }));

    expect(mockWebSocketInstances).toHaveLength(1);
    expect(mockWebSocketInstances[0].url).toContain('test-room-123');
    expect(mockWebSocketInstances[0].url).toContain('/ws');
  });

  it('includes token in URL when provided', () => {
    renderHook(() => useRoom({ roomId: 'test-room', token: 'admin-token-123' }));

    expect(mockWebSocketInstances[0].url).toContain('token=admin-token-123');
  });

  it('starts with connecting status', () => {
    const { result } = renderHook(() => useRoom({ roomId: 'test-room' }));

    expect(result.current.status).toBe('connecting');
  });

  it('updates status to connected after WebSocket opens', () => {
    const { result } = renderHook(() => useRoom({ roomId: 'test-room' }));

    // Advance timer to allow connection
    act(() => {
      vi.advanceTimersByTime(20);
    });

    expect(result.current.status).toBe('connected');
  });

  it('updates state when receiving sync message', async () => {
    const { result } = renderHook(() => useRoom({ roomId: 'test-room' }));

    act(() => {
      vi.advanceTimersByTime(20);
    });

    // Simulate sync message
    act(() => {
      mockWebSocketInstances[0].simulateMessage({
        type: 'sync',
        data: {
          meta: { id: 'room-1', template: 'mad-sad-glad', createdAt: '2024-01-01' },
          columns: [{ id: 'col-1', name: 'Mad', description: 'Test', position: 0 }],
          cards: [],
          isAdmin: true,
        },
      });
    });

    expect(result.current.state.isAdmin).toBe(true);
    expect(result.current.state.columns).toHaveLength(1);
    expect(result.current.state.columns[0].name).toBe('Mad');
  });

  it('sends messages through actions', async () => {
    const { result } = renderHook(() => useRoom({ roomId: 'test-room' }));

    act(() => {
      vi.advanceTimersByTime(20);
    });

    act(() => {
      result.current.actions.addCard('col-1', 'Test card');
    });

    expect(mockWebSocketInstances[0].send).toHaveBeenCalledWith(
      JSON.stringify({ type: 'card:add', data: { columnId: 'col-1', text: 'Test card' } })
    );
  });

  it('reconnects with exponential backoff after disconnect', async () => {
    const { result } = renderHook(() => useRoom({ roomId: 'test-room' }));

    // Initial connection
    act(() => {
      vi.advanceTimersByTime(20);
    });

    expect(result.current.status).toBe('connected');

    // First disconnect - should reconnect after 1 second
    act(() => {
      mockWebSocketInstances[0].simulateClose();
    });

    expect(result.current.status).toBe('disconnected');

    // Advance 500ms - not enough for reconnect
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(mockWebSocketInstances).toHaveLength(1);

    // Advance another 500ms - should trigger reconnect (1s total)
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(mockWebSocketInstances).toHaveLength(2);
  });

  it('provides all action methods', () => {
    const { result } = renderHook(() => useRoom({ roomId: 'test-room' }));

    expect(result.current.actions.addCard).toBeDefined();
    expect(result.current.actions.updateCard).toBeDefined();
    expect(result.current.actions.deleteCard).toBeDefined();
    expect(result.current.actions.publishCard).toBeDefined();
    expect(result.current.actions.publishAllCards).toBeDefined();
    expect(result.current.actions.addColumn).toBeDefined();
    expect(result.current.actions.updateColumn).toBeDefined();
    expect(result.current.actions.deleteColumn).toBeDefined();
    expect(result.current.actions.reorderColumn).toBeDefined();
  });

  it('closes WebSocket on unmount', () => {
    const { unmount } = renderHook(() => useRoom({ roomId: 'test-room' }));

    act(() => {
      vi.advanceTimersByTime(20);
    });

    unmount();

    expect(mockWebSocketInstances[0].close).toHaveBeenCalled();
  });
});
