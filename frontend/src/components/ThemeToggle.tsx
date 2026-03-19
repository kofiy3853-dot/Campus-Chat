import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800 group"
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? (
        <Moon className="w-5 h-5 text-gray-600 group-hover:text-gray-800 dark:text-gray-400 dark:group-hover:text-gray-200 transition-colors" />
      ) : (
        <Sun className="w-5 h-5 text-gray-400 group-hover:text-gray-200 dark:text-yellow-400 dark:group-hover:text-yellow-300 transition-colors" />
      )}
    </button>
  );
};

export default ThemeToggle;
