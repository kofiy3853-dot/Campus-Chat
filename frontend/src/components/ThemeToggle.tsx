import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2.5 rounded-lg transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800 group border border-gray-200 dark:border-gray-700"
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? (
        <Moon className="w-5 h-5 text-gray-600 group-hover:text-gray-800 transition-colors" />
      ) : (
        <Sun className="w-5 h-5 text-yellow-500 group-hover:text-yellow-400 transition-colors" />
      )}
    </button>
  );
};

export default ThemeToggle;
