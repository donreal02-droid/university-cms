import React from 'react';
import { useTheme } from '../context/ThemeContext';

const ThemeWrapper = ({ children }) => {
  const { theme } = useTheme();
  
  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === 'dark' ? 'dark bg-gray-900' : 'bg-gray-50'
    }`}>
      {children}
    </div>
  );
};

export default ThemeWrapper;