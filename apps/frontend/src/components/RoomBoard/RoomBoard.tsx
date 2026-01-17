import { useState } from 'react';
import type { RoomActions, RoomState } from '../../types/room';
import { Column } from '../Column';

interface RoomBoardProps {
  state: RoomState;
  actions: RoomActions;
}

export function RoomBoard({ state, actions }: RoomBoardProps): JSX.Element {
  const { columns, cards, isAdmin } = state;
  const [draggedColumnId, setDraggedColumnId] = useState<string | null>(null);
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [newColumnDescription, setNewColumnDescription] = useState('');

  const getCardsForColumn = (columnId: string): typeof cards => {
    return cards.filter((card) => card.columnId === columnId);
  };

  const handleAddColumn = (): void => {
    if (newColumnName.trim()) {
      actions.addColumn(newColumnName.trim(), newColumnDescription.trim());
      setNewColumnName('');
      setNewColumnDescription('');
      setIsAddingColumn(false);
    }
  };

  const handleAddColumnKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddColumn();
    } else if (e.key === 'Escape') {
      setNewColumnName('');
      setNewColumnDescription('');
      setIsAddingColumn(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, columnId: string): void => {
    setDraggedColumnId(columnId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent): void => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetColumnId: string): void => {
    e.preventDefault();
    if (!draggedColumnId || draggedColumnId === targetColumnId) {
      setDraggedColumnId(null);
      return;
    }

    const targetColumn = columns.find((c) => c.id === targetColumnId);
    if (targetColumn) {
      actions.reorderColumn(draggedColumnId, targetColumn.position);
    }
    setDraggedColumnId(null);
  };

  const handleDragEnd = (): void => {
    setDraggedColumnId(null);
  };

  const showEmptyState = columns.length === 0 && !isAdmin;

  if (showEmptyState) {
    return (
      <div
        data-testid="room-board-empty"
        className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400"
      >
        No columns in this room yet.
      </div>
    );
  }

  return (
    <div data-testid="room-board" className="flex gap-4 overflow-x-auto p-4 h-full">
      {columns.map((column) => (
        <div
          key={column.id}
          draggable={isAdmin}
          onDragStart={(e): void => handleDragStart(e, column.id)}
          onDragOver={handleDragOver}
          onDrop={(e): void => handleDrop(e, column.id)}
          onDragEnd={handleDragEnd}
          className={`h-full ${
            draggedColumnId === column.id ? 'opacity-50' : ''
          } ${isAdmin ? 'cursor-grab active:cursor-grabbing' : ''}`}
        >
          <Column
            column={column}
            cards={getCardsForColumn(column.id)}
            isAdmin={isAdmin}
            onAddCard={actions.addCard}
            onUpdateCard={actions.updateCard}
            onDeleteCard={actions.deleteCard}
            onPublishCard={actions.publishCard}
            onPublishAll={actions.publishAllCards}
            onUpdateColumn={actions.updateColumn}
            onDeleteColumn={actions.deleteColumn}
          />
        </div>
      ))}

      {/* Add Column */}
      {isAdmin && (
        <div className="flex-shrink-0 min-w-[300px] max-w-[350px] h-fit">
          {isAddingColumn ? (
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 space-y-3">
              <input
                data-testid="new-column-name-input"
                type="text"
                value={newColumnName}
                onChange={(e): void => setNewColumnName(e.target.value)}
                onKeyDown={handleAddColumnKeyDown}
                placeholder="Column name..."
                className="w-full p-2 text-sm font-semibold border rounded bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
              <input
                data-testid="new-column-description-input"
                type="text"
                value={newColumnDescription}
                onChange={(e): void => setNewColumnDescription(e.target.value)}
                onKeyDown={handleAddColumnKeyDown}
                placeholder="Description (optional)..."
                className="w-full p-2 text-sm border rounded bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="flex gap-2">
                <button
                  data-testid="add-column-submit-btn"
                  onClick={handleAddColumn}
                  className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
                >
                  Add Column
                </button>
                <button
                  data-testid="add-column-cancel-btn"
                  onClick={(): void => {
                    setNewColumnName('');
                    setNewColumnDescription('');
                    setIsAddingColumn(false);
                  }}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300 dark:hover:bg-gray-500"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              data-testid="add-column-btn"
              onClick={(): void => setIsAddingColumn(true)}
              className="w-full py-8 px-4 text-sm font-medium text-gray-500 dark:text-gray-400 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-gray-400 dark:hover:border-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              + Add Column
            </button>
          )}
        </div>
      )}

      {/* Empty state for admin when no columns */}
      {columns.length === 0 && isAdmin && !isAddingColumn && (
        <div
          data-testid="room-board-empty"
          className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400"
        >
          Click &quot;Add Column&quot; to get started.
        </div>
      )}
    </div>
  );
}
