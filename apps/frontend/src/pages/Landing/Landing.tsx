import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemeToggle } from '../../components/ThemeToggle';

interface Template {
  id: string;
  name: string;
  description: string;
  columns: string[];
}

const TEMPLATES: Template[] = [
  {
    id: 'mad-sad-glad',
    name: 'Mad Sad Glad',
    description: 'Classic retrospective format for emotional reflection',
    columns: ['Mad', 'Sad', 'Glad'],
  },
  {
    id: 'start-stop-continue',
    name: 'Start Stop Continue',
    description: 'Action-oriented format for process improvement',
    columns: ['Start', 'Stop', 'Continue'],
  },
  {
    id: 'liked-learned-lacked',
    name: 'Liked Learned Lacked',
    description: 'Learning-focused format for knowledge sharing',
    columns: ['Liked', 'Learned', 'Lacked'],
  },
  {
    id: 'blank',
    name: 'Blank',
    description: 'Start with an empty board',
    columns: [],
  },
];

async function createRoom(template: string): Promise<{ roomId: string; adminToken: string }> {
  const response = await fetch('/api/rooms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ template }),
  });

  if (!response.ok) {
    throw new Error('Failed to create room');
  }

  return response.json() as Promise<{ roomId: string; adminToken: string }>;
}

function TemplateCard({
  template,
  isSelected,
  onSelect,
}: {
  template: Template;
  isSelected: boolean;
  onSelect: () => void;
}): JSX.Element {
  return (
    <button
      data-testid={`template-${template.id}`}
      onClick={onSelect}
      className={`p-4 rounded-lg border-2 text-left transition-all ${
        isSelected
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
      }`}
    >
      <h3 className="font-semibold text-gray-900 dark:text-white">{template.name}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{template.description}</p>
      {template.columns.length > 0 && (
        <div className="flex gap-2 mt-3">
          {template.columns.map((col) => (
            <span
              key={col}
              className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded"
            >
              {col}
            </span>
          ))}
        </div>
      )}
    </button>
  );
}

export function Landing(): JSX.Element {
  const navigate = useNavigate();
  const [selectedTemplate, setSelectedTemplate] = useState<string>('mad-sad-glad');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateRoom = async (): Promise<void> => {
    setIsCreating(true);
    setError(null);

    try {
      const { roomId, adminToken } = await createRoom(selectedTemplate);

      // Store admin token in localStorage
      localStorage.setItem(`room:${roomId}:adminToken`, adminToken);

      // Navigate to the room
      navigate(`/room/${roomId}`);
    } catch {
      setError('Failed to create room. Please try again.');
      setIsCreating(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
        YART
      </h1>
      <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">Yet Another Retro Tool</p>

      <div className="w-full max-w-2xl">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Choose a template
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {TEMPLATES.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              isSelected={selectedTemplate === template.id}
              onSelect={(): void => setSelectedTemplate(template.id)}
            />
          ))}
        </div>

        {error && (
          <div
            data-testid="error-message"
            className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-sm"
          >
            {error}
          </div>
        )}

        <button
          data-testid="create-room-btn"
          onClick={handleCreateRoom}
          disabled={isCreating}
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg transition-colors"
        >
          {isCreating ? 'Creating...' : 'Create Room'}
        </button>
      </div>
    </div>
  );
}
