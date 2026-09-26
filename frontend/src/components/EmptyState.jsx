import React from 'react';
import { Film } from 'lucide-react';

const EmptyState = ({ title = 'No Data Found', message = 'There are no items to display at this moment.', actionText, onAction }) => {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center flex flex-col items-center justify-center my-6">
      <div className="bg-slate-800/80 p-4 rounded-full text-slate-400 mb-4">
        <Film size={40} />
      </div>
      <h3 className="text-xl font-bold text-slate-100 mb-2">{title}</h3>
      <p className="text-slate-400 max-w-md mb-6">{message}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="px-6 py-2.5 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-semibold rounded-xl transition shadow-lg"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
