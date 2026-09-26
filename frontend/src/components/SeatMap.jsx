import React, { useEffect, useState } from 'react';
import Seat from './Seat';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { Clock, Lock, Sparkles, Armchair, Crown, Star } from 'lucide-react';

const SeatMap = ({ showId, seats = [], selectedSeats = [], onSeatToggle, lockTimeLeft }) => {
  const { socket, joinShowRoom, leaveShowRoom } = useSocket();
  const { user } = useAuth();
  const [seatData, setSeatData] = useState(seats);

  useEffect(() => {
    setSeatData(seats);
  }, [seats]);

  useEffect(() => {
    if (showId) {
      joinShowRoom(showId);
    }

    if (socket) {
      const handleSeatStatusChanged = (data) => {
        if (data.showId == showId && data.seats) {
          setSeatData(data.seats);
        }
      };

      socket.on('seatStatusChanged', handleSeatStatusChanged);

      return () => {
        socket.off('seatStatusChanged', handleSeatStatusChanged);
        if (showId) {
          leaveShowRoom(showId);
        }
      };
    }
  }, [showId, socket]);

  // Group seats by row
  const rowsMap = seatData.reduce((acc, seat) => {
    if (!acc[seat.row]) acc[seat.row] = [];
    acc[seat.row].push(seat);
    return acc;
  }, {});

  const rows = Object.keys(rowsMap).sort();

  // Extract unique seat types and prices present in this layout
  const seatTypePrices = seatData.reduce((acc, s) => {
    const type = s.seatType || 'REGULAR';
    if (!acc[type]) acc[type] = s.price || 200;
    return acc;
  }, {});

  const formatTime = (seconds) => {
    if (seconds <= 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-2xl flex flex-col items-center backdrop-blur-md">
      {/* Curved 3D Cinema Screen Header */}
      <div className="w-full max-w-lg mb-10 flex flex-col items-center">
        <div className="w-full h-3 bg-gradient-to-r from-transparent via-rose-500 to-transparent rounded-t-full shadow-[0_-10px_30px_rgba(225,29,72,0.7)]" />
        <div className="w-full h-9 bg-gradient-to-b from-rose-500/15 via-rose-500/5 to-transparent border-t border-rose-500/40 flex items-center justify-center">
          <span className="text-[11px] font-black tracking-[0.3em] uppercase text-rose-300 flex items-center gap-2">
            <Sparkles size={12} className="text-amber-400" />
            CINEMA SCREEN THIS WAY
            <Sparkles size={12} className="text-amber-400" />
          </span>
        </div>
      </div>

      {/* Lock Expiration Countdown Bar */}
      {selectedSeats.length > 0 && lockTimeLeft !== null && (
        <div className="mb-6 px-5 py-2.5 bg-amber-950/80 border border-amber-500/60 rounded-2xl flex items-center gap-2.5 text-amber-300 font-bold text-sm shadow-lg shadow-amber-950/50 animate-pulse">
          <Clock size={18} className="text-amber-400 shrink-0" />
          <span>Temporary Lock Countdown: {formatTime(lockTimeLeft)}</span>
        </div>
      )}

      {/* Seat Layout Grid */}
      <div className="space-y-4 overflow-x-auto max-w-full pb-4 px-2">
        {rows.map((rowLabel) => {
          const rowSeats = rowsMap[rowLabel];
          const rowType = rowSeats[0]?.seatType || 'REGULAR';
          const rowPrice = rowSeats[0]?.price || 200;

          return (
            <div key={rowLabel} className="flex items-center gap-3">
              <span className="w-8 text-right font-extrabold text-xs text-slate-400 uppercase flex flex-col">
                <span>{rowLabel}</span>
              </span>
              <div className="flex items-center gap-2">
                {rowSeats.map((seat) => {
                  const isSelected = selectedSeats.includes(seat.seatNumber);
                  return (
                    <Seat
                      key={seat.id || seat.seatNumber}
                      seat={seat}
                      isSelected={isSelected}
                      currentUserId={user?.id}
                      onClick={() => onSeatToggle(seat)}
                    />
                  );
                })}
              </div>
              <span className="w-16 text-left text-[10px] font-bold text-slate-500">
                ₹{rowPrice}
              </span>
            </div>
          );
        })}
      </div>

      {/* Seat Types Legend Bar */}
      <div className="mt-8 pt-6 border-t border-slate-800/80 w-full flex flex-wrap items-center justify-center gap-4 text-xs text-slate-300 font-semibold">
        {Object.entries(seatTypePrices).map(([type, price]) => (
          <div key={type} className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 px-3.5 py-1.5 rounded-xl">
            <div
              className={`w-3.5 h-3.5 rounded-md border ${
                type === 'RECLINER'
                  ? 'bg-purple-950 border-purple-500'
                  : type === 'PREMIUM'
                  ? 'bg-amber-950 border-amber-500'
                  : 'bg-emerald-950 border-emerald-500'
              }`}
            />
            <span className="font-extrabold text-white">{type}</span>
            <span className="text-amber-400 font-mono">₹{price}</span>
          </div>
        ))}

        <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 px-3 py-1.5 rounded-xl">
          <div className="w-3.5 h-3.5 rounded-md bg-rose-600 border border-rose-400" />
          <span>Selected</span>
        </div>
        <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 px-3 py-1.5 rounded-xl">
          <div className="w-3.5 h-3.5 rounded-md bg-slate-800 border border-amber-500 flex items-center justify-center">
            <Lock size={8} className="text-amber-400" />
          </div>
          <span>Locked</span>
        </div>
        <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 px-3 py-1.5 rounded-xl opacity-50">
          <div className="w-3.5 h-3.5 rounded-md bg-slate-900 border border-slate-800" />
          <span>Booked</span>
        </div>
      </div>
    </div>
  );
};

export default SeatMap;
