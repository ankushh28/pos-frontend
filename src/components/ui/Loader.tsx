import React from 'react';

interface LoaderProps {
  label?: string;
  fullScreen?: boolean;
  className?: string;
}

export const Loader: React.FC<LoaderProps> = ({ label = 'Loading...', fullScreen = false, className = '' }) => {
  const content = (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      {label && <span className="mt-3 text-sm text-accent-500">{label}</span>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        {content}
      </div>
    );
  }

  return content;
};

export default Loader;
