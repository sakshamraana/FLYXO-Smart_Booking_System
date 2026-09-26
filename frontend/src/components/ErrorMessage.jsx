import React from 'react';
import { AlertCircle } from 'lucide-react';

const ErrorMessage = ({ message, onRetry }) => {
  if (!message) return null;

  return (
    <div className="bg-rose-950/60 border border-rose-600/50 text-rose-200 p-4 rounded-xl flex items-center justify-between my-4 shadow-lg">
      <div className="flex items-center gap-3">
        <AlertCircle className="text-rose-500 shrink-0" size={24} />
        <span>{message}</span>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-sm font-semibold transition"
        >
          Retry
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;
