import React, { useState } from 'react';
import MovieCard from './MovieCard';
import EmptyState from './EmptyState';
import { Search, Filter } from 'lucide-react';

const MovieGrid = ({ movies = [] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('ALL');

  const genres = ['ALL', ...new Set(movies.map((m) => m.genre?.split('/')[0]?.trim()).filter(Boolean))];

  const filteredMovies = movies.filter((movie) => {
    const matchesSearch =
      movie.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      movie.genre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      movie.language.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesGenre = selectedGenre === 'ALL' || movie.genre.includes(selectedGenre);

    return matchesSearch && matchesGenre;
  });

  return (
    <div className="space-y-6">
      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-3 text-slate-500" size={18} />
          <input
            type="text"
            placeholder="Search movies, genres, language..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 focus:outline-none transition"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
          <Filter size={16} className="text-slate-500 shrink-0 ml-1" />
          {genres.map((genre) => (
            <button
              key={genre}
              onClick={() => setSelectedGenre(genre)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedGenre === genre
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {genre}
            </button>
          ))}
        </div>
      </div>

      {/* Grid List */}
      {filteredMovies.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredMovies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No Movies Found"
          message="No movies matched your search criteria. Try resetting filters."
          actionText="Reset Filters"
          onAction={() => {
            setSearchTerm('');
            setSelectedGenre('ALL');
          }}
        />
      )}
    </div>
  );
};

export default MovieGrid;
