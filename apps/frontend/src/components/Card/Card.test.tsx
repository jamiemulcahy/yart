import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Card } from './Card';
import type { Card as CardType } from '../../types/room';

const createMockCard = (overrides: Partial<CardType> = {}): CardType => ({
  id: 'card-1',
  columnId: 'col-1',
  text: 'Test card content',
  authorId: 'author-1',
  isPublished: false,
  createdAt: '2024-01-01T00:00:00Z',
  ...overrides,
});

describe('Card', () => {
  const mockOnUpdate = vi.fn();
  const mockOnDelete = vi.fn();
  const mockOnPublish = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders card text', () => {
    const card = createMockCard({ text: 'My card text' });
    render(
      <Card
        card={card}
        isAdmin={false}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onPublish={mockOnPublish}
      />
    );

    expect(screen.getByText('My card text')).toBeInTheDocument();
  });

  it('shows admin actions when isAdmin is true', () => {
    const card = createMockCard();
    render(
      <Card
        card={card}
        isAdmin={true}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onPublish={mockOnPublish}
      />
    );

    expect(screen.getByTestId('card-edit-btn')).toBeInTheDocument();
    expect(screen.getByTestId('card-delete-btn')).toBeInTheDocument();
    expect(screen.getByTestId('card-publish-btn')).toBeInTheDocument();
  });

  it('hides admin actions when isAdmin is false', () => {
    const card = createMockCard();
    render(
      <Card
        card={card}
        isAdmin={false}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onPublish={mockOnPublish}
      />
    );

    expect(screen.queryByTestId('card-edit-btn')).not.toBeInTheDocument();
    expect(screen.queryByTestId('card-delete-btn')).not.toBeInTheDocument();
  });

  it('hides publish button for published cards', () => {
    const card = createMockCard({ isPublished: true });
    render(
      <Card
        card={card}
        isAdmin={true}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onPublish={mockOnPublish}
      />
    );

    expect(screen.queryByTestId('card-publish-btn')).not.toBeInTheDocument();
  });

  it('enters edit mode when edit button is clicked', () => {
    const card = createMockCard();
    render(
      <Card
        card={card}
        isAdmin={true}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onPublish={mockOnPublish}
      />
    );

    fireEvent.click(screen.getByTestId('card-edit-btn'));
    expect(screen.getByTestId('card-edit-input')).toBeInTheDocument();
  });

  it('saves edit when save button is clicked', () => {
    const card = createMockCard({ text: 'Original text' });
    render(
      <Card
        card={card}
        isAdmin={true}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onPublish={mockOnPublish}
      />
    );

    fireEvent.click(screen.getByTestId('card-edit-btn'));
    const input = screen.getByTestId('card-edit-input');
    fireEvent.change(input, { target: { value: 'Updated text' } });
    fireEvent.click(screen.getByTestId('card-save-btn'));

    expect(mockOnUpdate).toHaveBeenCalledWith('card-1', 'Updated text');
  });

  it('cancels edit when cancel button is clicked', () => {
    const card = createMockCard({ text: 'Original text' });
    render(
      <Card
        card={card}
        isAdmin={true}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onPublish={mockOnPublish}
      />
    );

    fireEvent.click(screen.getByTestId('card-edit-btn'));
    const input = screen.getByTestId('card-edit-input');
    fireEvent.change(input, { target: { value: 'Updated text' } });
    fireEvent.click(screen.getByTestId('card-cancel-btn'));

    expect(mockOnUpdate).not.toHaveBeenCalled();
    expect(screen.getByText('Original text')).toBeInTheDocument();
  });

  it('calls onDelete when delete button is clicked', () => {
    const card = createMockCard();
    render(
      <Card
        card={card}
        isAdmin={true}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onPublish={mockOnPublish}
      />
    );

    fireEvent.click(screen.getByTestId('card-delete-btn'));
    expect(mockOnDelete).toHaveBeenCalledWith('card-1');
  });

  it('calls onPublish when publish button is clicked', () => {
    const card = createMockCard();
    render(
      <Card
        card={card}
        isAdmin={true}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onPublish={mockOnPublish}
      />
    );

    fireEvent.click(screen.getByTestId('card-publish-btn'));
    expect(mockOnPublish).toHaveBeenCalledWith('card-1');
  });
});
