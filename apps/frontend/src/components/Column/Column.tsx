import { useState } from 'react';
import type { Card as CardType, Column as ColumnType } from '../../types/room';
import { Card } from '../Card';

interface ColumnProps {
  column: ColumnType;
  cards: CardType[];
  isAdmin: boolean;
  onAddCard: (columnId: string, text: string) => void;
  onUpdateCard: (id: string, text: string) => void;
  onDeleteCard: (id: string) => void;
  onPublishCard: (id: string) => void;
  onPublishAll: (columnId: string) => void;
  onUpdateColumn: (id: string, name: string, description: string) => void;
  onDeleteColumn: (id: string) => void;
}

export function Column({
  column,
  cards,
  isAdmin,
  onAddCard,
  onUpdateCard,
  onDeleteCard,
  onPublishCard,
  onPublishAll,
  onUpdateColumn,
  onDeleteColumn,
}: ColumnProps): JSX.Element {
  const [newCardText, setNewCardText] = useState('');
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [isEditingColumn, setIsEditingColumn] = useState(false);
  const [editName, setEditName] = useState(column.name);
  const [editDescription, setEditDescription] = useState(column.description);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleAddCard = (): void => {
    if (newCardText.trim()) {
      onAddCard(column.id, newCardText.trim());
      setNewCardText('');
      setIsAddingCard(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddCard();
    } else if (e.key === 'Escape') {
      setNewCardText('');
      setIsAddingCard(false);
    }
  };

  const handleSaveColumn = (): void => {
    if (editName.trim()) {
      onUpdateColumn(column.id, editName.trim(), editDescription.trim());
      setIsEditingColumn(false);
    }
  };

  const handleCancelEdit = (): void => {
    setEditName(column.name);
    setEditDescription(column.description);
    setIsEditingColumn(false);
  };

  const handleEditKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveColumn();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const handleDeleteColumn = (): void => {
    onDeleteColumn(column.id);
    setShowDeleteConfirm(false);
  };

  const publishedCards = cards.filter((c) => c.isPublished);
  const unpublishedCards = cards.filter((c) => !c.isPublished);

  return (
    <div
      data-testid={`column-${column.id}`}
      className="flex flex-col bg-gray-100 dark:bg-gray-800 rounded-lg min-w-[300px] max-w-[350px] h-full"
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        {isEditingColumn ? (
          <div className="space-y-2">
            <input
              data-testid="column-name-input"
              type="text"
              value={editName}
              onChange={(e): void => setEditName(e.target.value)}
              onKeyDown={handleEditKeyDown}
              className="w-full p-2 text-sm font-semibold border rounded bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
            <input
              data-testid="column-description-input"
              type="text"
              value={editDescription}
              onChange={(e): void => setEditDescription(e.target.value)}
              onKeyDown={handleEditKeyDown}
              placeholder="Description..."
              className="w-full p-2 text-sm border rounded bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="flex gap-2">
              <button
                data-testid="column-save-btn"
                onClick={handleSaveColumn}
                className="px-2 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
              >
                Save
              </button>
              <button
                data-testid="column-cancel-btn"
                onClick={handleCancelEdit}
                className="px-2 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300 dark:hover:bg-gray-500"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {column.name}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {column.description}
                </p>
              </div>
              {isAdmin && (
                <div className="flex gap-1">
                  <button
                    data-testid="column-edit-btn"
                    onClick={(): void => setIsEditingColumn(true)}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    title="Edit column"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                      />
                    </svg>
                  </button>
                  <button
                    data-testid="column-delete-btn"
                    onClick={(): void => setShowDeleteConfirm(true)}
                    className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                    title="Delete column"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              )}
            </div>
            {showDeleteConfirm && (
              <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
                <p className="text-xs text-red-700 dark:text-red-400 mb-2">
                  Delete this column and all its cards?
                </p>
                <div className="flex gap-2">
                  <button
                    data-testid="column-delete-confirm-btn"
                    onClick={handleDeleteColumn}
                    className="px-2 py-1 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700"
                  >
                    Delete
                  </button>
                  <button
                    data-testid="column-delete-cancel-btn"
                    onClick={(): void => setShowDeleteConfirm(false)}
                    className="px-2 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300 dark:hover:bg-gray-500"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Published Cards */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {publishedCards.map((card) => (
          <Card
            key={card.id}
            card={card}
            isAdmin={isAdmin}
            onUpdate={onUpdateCard}
            onDelete={onDeleteCard}
            onPublish={onPublishCard}
          />
        ))}
        {publishedCards.length === 0 && (
          <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">No cards yet</p>
        )}
      </div>

      {/* Unpublished Cards Tray */}
      {unpublishedCards.length > 0 && (
        <div
          data-testid="unpublished-tray"
          className="border-t-2 border-dashed border-yellow-400 dark:border-yellow-600 bg-yellow-50/50 dark:bg-yellow-900/10"
        >
          <div className="p-2 flex items-center justify-between">
            <span className="text-xs font-medium text-yellow-700 dark:text-yellow-400">
              Unpublished ({unpublishedCards.length})
            </span>
            {isAdmin && (
              <button
                data-testid="publish-all-btn"
                onClick={(): void => onPublishAll(column.id)}
                className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
              >
                Publish all
              </button>
            )}
          </div>
          <div className="px-3 pb-3 space-y-2 max-h-48 overflow-y-auto">
            {unpublishedCards.map((card) => (
              <Card
                key={card.id}
                card={card}
                isAdmin={isAdmin}
                onUpdate={onUpdateCard}
                onDelete={onDeleteCard}
                onPublish={onPublishCard}
              />
            ))}
          </div>
        </div>
      )}

      {/* Add Card - Everyone can add cards */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700">
        {isAddingCard ? (
          <div className="space-y-2">
            <textarea
              data-testid="new-card-input"
              value={newCardText}
              onChange={(e): void => setNewCardText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter card text..."
              className="w-full p-2 text-sm border rounded resize-none bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                data-testid="add-card-submit-btn"
                onClick={handleAddCard}
                className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
              >
                Add Card
              </button>
              <button
                data-testid="add-card-cancel-btn"
                onClick={(): void => {
                  setNewCardText('');
                  setIsAddingCard(false);
                }}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300 dark:hover:bg-gray-500"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            data-testid="add-card-btn"
            onClick={(): void => setIsAddingCard(true)}
            className="w-full py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
          >
            + Add Card
          </button>
        )}
      </div>
    </div>
  );
}
