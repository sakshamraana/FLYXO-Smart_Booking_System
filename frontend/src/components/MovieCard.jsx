import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Globe, Shield, Ticket } from 'lucide-react';

const MovieCard = ({ movie }) => {
  const getRatingBadge = (rating, minAge) => {
    switch (rating?.toUpperCase()) {
      case 'A':
        return { text: `A (${minAge}+)`, color: 'bg-rose-500/20 text-rose-400 border-rose-500/40' };
      case 'UA':
        return { text: `UA (${minAge}+)`, color: 'bg-amber-500/20 text-amber-400 border-amber-500/40' };
      default:
        return { text: 'U (All Ages)', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' };
    }
  };

  const ratingInfo = getRatingBadge(movie.rating, movie.minimumAge);

  return (
    <div className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl overflow-hidden shadow-xl flex flex-col group transition-all duration-300 hover:-translate-y-1">
      {/* Thumbnail / Poster */}
      <div className="relative aspect-[16/10] sm:aspect-[3/4] overflow-hidden bg-slate-950">
        <img
          src={movie.thumbnail}
          alt={movie.title}
          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-80" />

        {/* Rating Pill */}
        <div className="absolute top-3 left-3">
          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border backdrop-blur-md ${ratingInfo.color}`}>
            {ratingInfo.text}
          </span>
        </div>

        {/* Language Badge */}
        <div className="absolute top-3 right-3 bg-slate-950/70 border border-slate-700/60 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-medium text-slate-300 flex items-center gap-1">
          <Globe size={12} />
          {movie.language}
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <span className="text-xs font-semibold text-rose-500 uppercase tracking-wider">{movie.genre}</span>
          <h3 className="text-lg font-bold text-slate-100 mt-1 line-clamp-1 group-hover:text-rose-400 transition">
            {movie.title}
          </h3>
          <p className="text-slate-400 text-xs mt-2 line-clamp-2 leading-relaxed">{movie.description}</p>
        </div>

        <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-1 text-slate-400 text-xs font-medium">
            <Clock size={14} className="text-slate-500" />
            <span>{movie.duration} mins</span>
          </div>

          <Link
            to={`/movie/${movie.id}`}
            className="px-4 py-2 bg-slate-800 hover:bg-rose-600 text-slate-200 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
          >
            <Ticket size={14} />
            Book Now
          </Link>
        </div>
      </div>
    </div>
  );
};

export default MovieCard;
