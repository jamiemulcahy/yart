import { useTheme } from '../../hooks/useTheme';
import type { Theme } from '../../contexts/ThemeContext';

const THEME_OPTIONS: { value: Theme; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'system', label: 'System' },
  { value: 'dark', label: 'Dark' },
];

export function ThemeToggle(): JSX.Element {
  const { theme, setTheme } = useTheme();

  return (
    <div
      data-testid="theme-toggle"
      className="inline-flex rounded-lg bg-gray-100 dark:bg-gray-700 p-0.5"
    >
      {THEME_OPTIONS.map((option) => (
        <button
          key={option.value}
          data-testid={`theme-${option.value}`}
          onClick={(): void => setTheme(option.value)}
          className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
            theme === option.value
              ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
