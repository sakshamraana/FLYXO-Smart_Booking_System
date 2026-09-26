import React from 'react';
import { Lock, Crown, Armchair, Sparkles } from 'lucide-react';

const Seat = ({ seat, isSelected, currentUserId, onClick }) => {
  const isAvailable = seat.status === 'AVAILABLE';
  const isBooked = seat.status === 'BOOKED';
  const isLocked = seat.status === 'LOCKED';
  const isLockedByMe = isLocked && Number(seat.lockedBy) === Number(currentUserId);

  const seatType = seat.seatType || 'REGULAR';
  const price = seat.price || 200;

  let typeBadgeColor = 'border-emerald-500/50';
  if (seatType === 'PREMIUM') typeBadgeColor = 'border-amber-500/80';
  if (seatType === 'RECLINER') typeBadgeColor = 'border-purple-500/80';

  let styleClass = '';
  if (isSelected || isLockedByMe) {
    styleClass = 'bg-gradient-to-tr from-rose-600 to-rose-500 border-rose-400 text-white shadow-lg shadow-rose-600/50 scale-105 ring-2 ring-rose-400/40';
  } else if (isAvailable) {
    if (seatType === 'RECLINER') {
      styleClass = 'bg-purple-950/60 border-purple-500/80 text-purple-300 hover:bg-purple-600 hover:text-white hover:scale-105 shadow-md shadow-purple-950/40';
    } else if (seatType === 'PREMIUM') {
      styleClass = 'bg-amber-950/60 border-amber-500/80 text-amber-300 hover:bg-amber-500 hover:text-slate-950 hover:scale-105 shadow-md shadow-amber-950/40';
    } else {
      styleClass = 'bg-emerald-950/60 border-emerald-500/80 text-emerald-300 hover:bg-emerald-500 hover:text-slate-950 hover:scale-105 shadow-md shadow-emerald-950/40';
    }
  } else if (isLocked) {
    styleClass = 'bg-slate-800 border-amber-500/80 text-amber-400 cursor-not-allowed opacity-90 shadow-sm';
  } else if (isBooked) {
    styleClass = 'bg-slate-900/90 border-slate-800 text-slate-600 cursor-not-allowed opacity-30';
  }

  return (
    <button
      type="button"
      disabled={isBooked || (isLocked && !isLockedByMe)}
      onClick={() => onClick(seat)}
      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl border flex flex-col items-center justify-center font-extrabold text-[11px] transition-all duration-200 relative ${styleClass}`}
      title={`Seat ${seat.seatNumber} | ${seatType} (₹${price}) | Status: ${seat.status}`}
    >
      {isLocked && !isLockedByMe ? (
        <Lock size={12} className="text-amber-400 animate-pulse" />
      ) : (
        <span>{seat.seatNumber}</span>
      )}
    </button>
  );
};

export default Seat;
