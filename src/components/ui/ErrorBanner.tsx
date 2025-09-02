import React from 'react';

interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({ message, onRetry }) => {
  return (
    <div className="bg-red-50 border border-red-100 text-red-700 rounded-xl p-4 flex items-start justify-between">
      <div className="pr-4 text-sm">{message}</div>
      {onRetry && (
        <button onClick={onRetry} className="ml-4 text-red-700 hover:text-red-800 text-sm font-medium">Retry</button>
      )}
    </div>
  );
};

export default ErrorBanner;
