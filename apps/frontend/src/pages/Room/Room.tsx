import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { RoomBoard } from '../../components/RoomBoard';
import { ThemeToggle } from '../../components/ThemeToggle';
import { useRoom } from '../../hooks/useRoom';
import type { ConnectionStatus } from '../../types/room';

function getAdminToken(roomId: string): string | null {
  try {
    return localStorage.getItem(`room:${roomId}:adminToken`);
  } catch {
    return null;
  }
}

function ConnectionStatusBadge({ status }: { status: ConnectionStatus }): JSX.Element {
  const statusConfig: Record<ConnectionStatus, { label: string; className: string }> = {
    connecting: {
      label: 'Connecting...',
      className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    },
    connected: {
      label: 'Connected',
      className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    },
    disconnected: {
      label: 'Disconnected',
      className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    },
    error: {
      label: 'Connection Error',
      className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    },
  };

  const config = statusConfig[status];

  return (
    <span
      data-testid="connection-status"
      className={`px-2 py-1 text-xs font-medium rounded ${config.className}`}
    >
      {config.label}
    </span>
  );
}

export function Room(): JSX.Element {
  const { roomId = '' } = useParams<{ roomId: string }>();
  const token = getAdminToken(roomId);
  const { state, status, actions } = useRoom({ roomId, token });
  const [copied, setCopied] = useState(false);

  const handleShare = async (): Promise<void> => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!roomId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-500">Invalid room ID</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="text-xl font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            YART
          </Link>
          {state.meta && (
            <span className="text-sm text-gray-500 dark:text-gray-400">{state.meta.template}</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            data-testid="share-btn"
            onClick={handleShare}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
          >
            {copied ? 'Copied!' : 'Share'}
          </button>
          {state.isAdmin && (
            <span
              data-testid="admin-badge"
              className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 rounded"
            >
              Admin
            </span>
          )}
          <ConnectionStatusBadge status={status} />
          <ThemeToggle />
        </div>
      </header>

      {/* Board */}
      <main className="flex-1 overflow-hidden">
        {status === 'connecting' && !state.meta ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 dark:text-gray-400">Loading room...</p>
          </div>
        ) : (
          <RoomBoard state={state} actions={actions} />
        )}
      </main>
    </div>
  );
}
