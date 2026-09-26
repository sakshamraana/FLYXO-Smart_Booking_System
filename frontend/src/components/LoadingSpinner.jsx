import React from 'react';
import { Film, Loader2 } from 'lucide-react';

const LoadingSpinner = ({ message = 'Loading FLYXO...', type = 'default' }) => {
  if (type === 'grid') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden space-y-3 p-3">
            <div className="w-full aspect-[2/3] rounded-2xl skeleton-shimmer" />
            <div className="h-5 w-3/4 rounded-lg skeleton-shimmer" />
            <div className="h-4 w-1/2 rounded-lg skeleton-shimmer" />
            <div className="h-10 w-full rounded-xl skeleton-shimmer mt-2" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-12 text-center flex flex-col items-center justify-center my-8 max-w-md mx-auto shadow-2xl backdrop-blur-md">
      <div className="relative mb-4 flex items-center justify-center">
        <div className="w-14 h-14 rounded-2xl bg-rose-600/10 border border-rose-500/30 flex items-center justify-center text-rose-500">
          <Film size={28} className="animate-bounce" />
        </div>
        <Loader2 size={64} className="animate-spin text-rose-500 absolute -inset-1 opacity-40" />
      </div>
      <p className="text-slate-200 font-semibold text-sm tracking-wide animate-pulse">{message}</p>
      <span className="text-[11px] text-slate-500 mt-1 uppercase tracking-widest font-bold">FLYXO Real-Time Engine</span>
    </div>
  );
};

export default LoadingSpinner;
