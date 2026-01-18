import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Column } from './Column';
import type { Card as CardType, Column as ColumnType } from '../../types/room';

const createMockColumn = (overrides: Partial<ColumnType> = {}): ColumnType => ({
  id: 'col-1',
  name: 'Test Column',
  description: 'Test description',
  position: 0,
  ...overrides,
});

const createMockCard = (overrides: Partial<CardType> = {}): CardType => ({
  id: 'card-1',
  columnId: 'col-1',
  text: 'Test card',
  authorId: 'author-1',
  isPublished: false,
  createdAt: '2024-01-01T00:00:00Z',
  ...overrides,
});

describe('Column', () => {
  const mockOnAddCard = vi.fn();
  const mockOnUpdateCard = vi.fn();
  const mockOnDeleteCard = vi.fn();
  const mockOnPublishCard = vi.fn();
  const mockOnPublishAll = vi.fn();
  const mockOnUpdateColumn = vi.fn();
  const mockOnDeleteColumn = vi.fn();

  const defaultProps = {
    column: createMockColumn(),
    cards: [],
    isAdmin: false,
    onAddCard: mockOnAddCard,
    onUpdateCard: mockOnUpdateCard,
    onDeleteCard: mockOnDeleteCard,
    onPublishCard: mockOnPublishCard,
    onPublishAll: mockOnPublishAll,
    onUpdateColumn: mockOnUpdateColumn,
    onDeleteColumn: mockOnDeleteColumn,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders column name and description', () => {
    render(
      <Column
        {...defaultProps}
        column={createMockColumn({ name: 'Mad', description: 'What made you frustrated?' })}
      />
    );

    expect(screen.getByText('Mad')).toBeInTheDocument();
    expect(screen.getByText('What made you frustrated?')).toBeInTheDocument();
  });

  it('renders cards in the column', () => {
    const cards = [
      createMockCard({ id: 'card-1', text: 'First card' }),
      createMockCard({ id: 'card-2', text: 'Second card' }),
    ];

    render(<Column {...defaultProps} cards={cards} />);

    expect(screen.getByText('First card')).toBeInTheDocument();
    expect(screen.getByText('Second card')).toBeInTheDocument();
  });

  it('shows add card button for admin', () => {
    render(<Column {...defaultProps} isAdmin={true} />);

    expect(screen.getByTestId('add-card-btn')).toBeInTheDocument();
  });

  it('shows add card button for non-admin (everyone can add cards)', () => {
    render(<Column {...defaultProps} isAdmin={false} />);

    expect(screen.getByTestId('add-card-btn')).toBeInTheDocument();
  });

  it('shows add card form when add button is clicked', () => {
    render(<Column {...defaultProps} isAdmin={true} />);

    fireEvent.click(screen.getByTestId('add-card-btn'));

    expect(screen.getByTestId('new-card-input')).toBeInTheDocument();
    expect(screen.getByTestId('add-card-submit-btn')).toBeInTheDocument();
  });

  it('adds card when form is submitted', () => {
    render(<Column {...defaultProps} isAdmin={true} />);

    fireEvent.click(screen.getByTestId('add-card-btn'));
    const input = screen.getByTestId('new-card-input');
    fireEvent.change(input, { target: { value: 'New card text' } });
    fireEvent.click(screen.getByTestId('add-card-submit-btn'));

    expect(mockOnAddCard).toHaveBeenCalledWith('col-1', 'New card text');
  });

  it('cancels add card when cancel is clicked', () => {
    render(<Column {...defaultProps} isAdmin={true} />);

    fireEvent.click(screen.getByTestId('add-card-btn'));
    fireEvent.click(screen.getByTestId('add-card-cancel-btn'));

    expect(screen.queryByTestId('new-card-input')).not.toBeInTheDocument();
    expect(screen.getByTestId('add-card-btn')).toBeInTheDocument();
  });

  it('shows publish all button when there are unpublished cards', () => {
    const cards = [createMockCard({ isPublished: false })];
    render(<Column {...defaultProps} cards={cards} isAdmin={true} />);

    expect(screen.getByTestId('publish-all-btn')).toBeInTheDocument();
    expect(screen.getByText('Publish all')).toBeInTheDocument();
    expect(screen.getByText('Unpublished (1)')).toBeInTheDocument();
  });

  it('hides publish all button when all cards are published', () => {
    const cards = [createMockCard({ isPublished: true })];
    render(<Column {...defaultProps} cards={cards} isAdmin={true} />);

    expect(screen.queryByTestId('publish-all-btn')).not.toBeInTheDocument();
  });

  it('calls onPublishAll when publish all is clicked', () => {
    const cards = [createMockCard({ isPublished: false })];
    render(<Column {...defaultProps} cards={cards} isAdmin={true} />);

    fireEvent.click(screen.getByTestId('publish-all-btn'));

    expect(mockOnPublishAll).toHaveBeenCalledWith('col-1');
  });
});
