import { useState } from 'react';
import type { Card as CardType } from '../../types/room';

interface CardProps {
  card: CardType;
  isAdmin: boolean;
  onUpdate: (id: string, text: string) => void;
  onDelete: (id: string) => void;
  onPublish: (id: string) => void;
}

export function Card({ card, isAdmin, onUpdate, onDelete, onPublish }: CardProps): JSX.Element {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(card.text);

  // Card is masked if it's unpublished and has no text (admin viewing others' cards)
  const isMasked = !card.isPublished && !card.text;

  const handleSave = (): void => {
    if (editText.trim() && editText !== card.text) {
      onUpdate(card.id, editText.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = (): void => {
    setEditText(card.text);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <div
      data-testid={`card-${card.id}`}
      className={`rounded-lg p-3 shadow-sm border transition-colors ${
        card.isPublished
          ? 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600'
          : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700'
      }`}
    >
      {isEditing ? (
        <div className="space-y-2">
          <textarea
            data-testid="card-edit-input"
            value={editText}
            onChange={(e): void => setEditText(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full p-2 text-sm border rounded resize-none bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
            autoFocus
          />
          <div className="flex gap-2">
            <button
              data-testid="card-save-btn"
              onClick={handleSave}
              className="px-2 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
            >
              Save
            </button>
            <button
              data-testid="card-cancel-btn"
              onClick={handleCancel}
              className="px-2 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300 dark:hover:bg-gray-500"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          {isMasked ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 italic">
              Card content hidden until published
            </p>
          ) : (
            <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words">
              {card.text}
            </p>
          )}
          {isAdmin && (
            <div className="flex gap-2 mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
              {!isMasked && (
                <button
                  data-testid="card-edit-btn"
                  onClick={(): void => setIsEditing(true)}
                  className="px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                >
                  Edit
                </button>
              )}
              {!card.isPublished && (
                <button
                  data-testid="card-publish-btn"
                  onClick={(): void => onPublish(card.id)}
                  className="px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400"
                >
                  Publish
                </button>
              )}
              {!isMasked && (
                <button
                  data-testid="card-delete-btn"
                  onClick={(): void => onDelete(card.id)}
                  className="px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                >
                  Delete
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
