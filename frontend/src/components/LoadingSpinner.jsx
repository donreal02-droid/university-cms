import React from 'react';

const LoadingSpinner = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="relative">
        {/* Outer ring - light mode gray, dark mode gray-700 */}
        <div className="h-24 w-24 rounded-full border-t-8 border-b-8 border-gray-200 dark:border-gray-700"></div>
        {/* Inner spinning ring - primary color */}
        <div className="absolute top-0 left-0 h-24 w-24 rounded-full border-t-8 border-b-8 border-primary-600 dark:border-primary-400 animate-spin"></div>
      </div>
    </div>
  );
};

export default LoadingSpinner;