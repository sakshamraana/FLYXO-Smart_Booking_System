import React from 'react';
import { Calendar, Clock, Monitor, Armchair, ArrowRight } from 'lucide-react';

const ShowCard = ({ show, onSelect, isSelected }) => {
  const isAvailable = show.availableSeats > 0;

  return (
    <div
      onClick={() => isAvailable && onSelect(show)}
      className={`p-4 rounded-2xl border transition cursor-pointer flex flex-col justify-between ${
        isSelected
          ? 'bg-gradient-to-br from-rose-950/80 to-slate-900 border-rose-500 ring-2 ring-rose-500/50 shadow-lg shadow-rose-950/40'
          : isAvailable
          ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
          : 'bg-slate-950/50 border-slate-900 opacity-60 cursor-not-allowed'
      }`}
    >
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="px-2.5 py-1 bg-slate-800 border border-slate-700 text-rose-400 font-bold text-xs rounded-lg flex items-center gap-1">
            <Monitor size={12} />
            {show.screen}
          </span>
          <span className="text-emerald-400 font-extrabold text-sm">₹{show.price}</span>
        </div>

        <div className="space-y-1.5 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-slate-500" />
            <span className="font-semibold text-slate-200">{show.showDate}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-slate-500" />
            <span className="font-bold text-white text-sm">{show.showTime}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs">
          <Armchair size={14} className={isAvailable ? 'text-emerald-500' : 'text-rose-500'} />
          <span className={isAvailable ? 'text-emerald-400 font-medium' : 'text-rose-400 font-semibold'}>
            {isAvailable ? `${show.availableSeats} seats left` : 'Sold Out'}
          </span>
        </div>

        {isAvailable && (
          <span className={`text-xs font-bold flex items-center gap-1 ${isSelected ? 'text-rose-400' : 'text-slate-400'}`}>
            {isSelected ? 'Selected' : 'Select'}
            <ArrowRight size={12} />
          </span>
        )}
      </div>
    </div>
  );
};

export default ShowCard;
