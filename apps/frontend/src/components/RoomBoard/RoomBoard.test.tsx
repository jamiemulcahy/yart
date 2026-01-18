import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { RoomBoard } from './RoomBoard';
import type { RoomActions, RoomState } from '../../types/room';

const createMockActions = (): RoomActions => ({
  addCard: vi.fn(),
  updateCard: vi.fn(),
  deleteCard: vi.fn(),
  publishCard: vi.fn(),
  publishAllCards: vi.fn(),
  addColumn: vi.fn(),
  updateColumn: vi.fn(),
  deleteColumn: vi.fn(),
  reorderColumn: vi.fn(),
});

const createMockState = (overrides: Partial<RoomState> = {}): RoomState => ({
  meta: {
    id: 'room-1',
    template: 'mad-sad-glad',
    createdAt: '2024-01-01T00:00:00Z',
  },
  columns: [],
  cards: [],
  isAdmin: false,
  ...overrides,
});

describe('RoomBoard', () => {
  it('renders empty state when there are no columns', () => {
    const state = createMockState({ columns: [] });
    const actions = createMockActions();

    render(<RoomBoard state={state} actions={actions} />);

    expect(screen.getByTestId('room-board-empty')).toBeInTheDocument();
    expect(screen.getByText('No columns in this room yet.')).toBeInTheDocument();
  });

  it('renders columns', () => {
    const state = createMockState({
      columns: [
        { id: 'col-1', name: 'Mad', description: 'What frustrated you?', position: 0 },
        { id: 'col-2', name: 'Sad', description: 'What made you sad?', position: 1 },
        { id: 'col-3', name: 'Glad', description: 'What made you happy?', position: 2 },
      ],
    });
    const actions = createMockActions();

    render(<RoomBoard state={state} actions={actions} />);

    expect(screen.getByTestId('room-board')).toBeInTheDocument();
    expect(screen.getByText('Mad')).toBeInTheDocument();
    expect(screen.getByText('Sad')).toBeInTheDocument();
    expect(screen.getByText('Glad')).toBeInTheDocument();
  });

  it('renders cards in correct columns', () => {
    const state = createMockState({
      columns: [
        { id: 'col-1', name: 'Mad', description: 'Test', position: 0 },
        { id: 'col-2', name: 'Sad', description: 'Test', position: 1 },
      ],
      cards: [
        {
          id: 'card-1',
          columnId: 'col-1',
          text: 'Card in Mad',
          authorId: 'a1',
          isPublished: true,
          createdAt: '2024-01-01T00:00:00Z',
        },
        {
          id: 'card-2',
          columnId: 'col-2',
          text: 'Card in Sad',
          authorId: 'a1',
          isPublished: true,
          createdAt: '2024-01-01T00:00:00Z',
        },
      ],
    });
    const actions = createMockActions();

    render(<RoomBoard state={state} actions={actions} />);

    expect(screen.getByText('Card in Mad')).toBeInTheDocument();
    expect(screen.getByText('Card in Sad')).toBeInTheDocument();
  });

  it('passes isAdmin to columns', () => {
    const state = createMockState({
      columns: [{ id: 'col-1', name: 'Test', description: 'Test', position: 0 }],
      isAdmin: true,
    });
    const actions = createMockActions();

    render(<RoomBoard state={state} actions={actions} />);

    // Admin sees add card button
    expect(screen.getByTestId('add-card-btn')).toBeInTheDocument();
  });
});
