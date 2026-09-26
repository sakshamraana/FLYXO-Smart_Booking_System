import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { requestGraphQL } from '../utils/graphqlClient';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { Film, Calendar, Clock, MapPin, Building2, Ticket, ChevronRight, ShieldAlert, Sparkles } from 'lucide-react';

const GET_MOVIE_DETAILS = `
  query GetMovieDetails($id: ID!, $city: String, $showDate: String) {
    movie(id: $id) {
      id
      title
      description
      genre
      duration
      language
      rating
      minimumAge
      thumbnail
      releaseDate
    }
    showsByMovie(movieId: $id, city: $city, showDate: $showDate) {
      id
      showDate
      showTime
      screen
      language
      format
      availableSeats
      totalSeats
      price
      theatre {
        id
        name
        address
        city
        image
      }
    }
    cities
  }
`;

const MovieDetails = () => {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [shows, setShows] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, [id, selectedCity, selectedDate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await requestGraphQL(GET_MOVIE_DETAILS, {
        id,
        city: selectedCity || null,
        showDate: selectedDate,
      });
      setMovie(data.movie);
      setShows(data.showsByMovie || []);
      setCities(data.cities || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Group shows by Theatre
  const groupedShowsByTheatre = shows.reduce((acc, show) => {
    if (!show.theatre) return acc;
    const theatreId = show.theatre.id;
    if (!acc[theatreId]) {
      acc[theatreId] = {
        theatre: show.theatre,
        shows: [],
      };
    }
    acc[theatreId].shows.push(show);
    return acc;
  }, {});

  const datesList = [0, 1, 2].map((offset) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return {
      dateStr: d.toISOString().split('T')[0],
      dayName: offset === 0 ? 'Today' : offset === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short' }),
      formattedDate: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    };
  });

  if (loading) return <LoadingSpinner message="Loading movie details & showtimes..." />;
  if (error) return <ErrorMessage message={error} />;
  if (!movie) return <ErrorMessage message="Movie not found." />;

  return (
    <div className="space-y-10 pb-16">
      {/* Movie Details Header */}
      <div className="relative rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl">
        <div className="flex flex-col md:flex-row gap-8 p-6 sm:p-10">
          <img
            src={movie.thumbnail}
            alt={movie.title}
            className="w-full md:w-64 h-96 object-cover rounded-2xl shadow-2xl shrink-0"
          />

          <div className="flex-1 space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 bg-rose-600/20 border border-rose-500/30 text-rose-400 font-black text-xs rounded-xl">
                Rating: {movie.rating}
              </span>
              <span className="px-3 py-1 bg-slate-800 border border-slate-700 text-slate-300 font-bold text-xs rounded-xl flex items-center gap-1">
                <ShieldAlert size={12} className="text-amber-400" />
                Minimum Age: {movie.minimumAge}+ Years
              </span>
              <span className="px-3 py-1 bg-slate-800 text-slate-300 font-bold text-xs rounded-xl">
                {movie.genre}
              </span>
              <span className="px-3 py-1 bg-slate-800 text-slate-300 font-bold text-xs rounded-xl">
                {movie.duration} Mins
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-white">{movie.title}</h1>
            <p className="text-slate-300 text-sm leading-relaxed max-w-3xl">{movie.description}</p>

            <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-slate-800 text-xs text-slate-400">
              <div>
                <span className="block text-slate-500 uppercase font-bold text-[10px]">Language</span>
                <span className="font-extrabold text-slate-200">{movie.language}</span>
              </div>
              <div>
                <span className="block text-slate-500 uppercase font-bold text-[10px]">Release Date</span>
                <span className="font-extrabold text-slate-200">{movie.releaseDate}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* WHERE DO YOU WANT TO WATCH? */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <Sparkles className="text-amber-400" size={24} />
              WHERE DO YOU WANT TO WATCH?
            </h2>
            <p className="text-xs text-slate-400">Select a theatre and showtime to book your seats.</p>
          </div>

          {/* City Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400">City:</span>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-slate-200 text-xs font-bold rounded-xl px-3 py-2 focus:outline-none focus:border-rose-500"
            >
              <option value="">All Cities</option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-3">
          {datesList.map((d) => (
            <button
              key={d.dateStr}
              onClick={() => setSelectedDate(d.dateStr)}
              className={`px-5 py-3 rounded-2xl font-bold text-xs transition flex flex-col items-center gap-0.5 ${
                selectedDate === d.dateStr
                  ? 'bg-gradient-to-r from-rose-600 to-amber-500 text-white shadow-lg shadow-rose-600/30'
                  : 'bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800'
              }`}
            >
              <span className="text-sm font-black">{d.dayName}</span>
              <span className="text-[10px] opacity-80">{d.formattedDate}</span>
            </button>
          ))}
        </div>

        {/* Theatres & Showtimes List */}
        {Object.keys(groupedShowsByTheatre).length === 0 ? (
          <div className="p-12 text-center bg-slate-900/50 border border-slate-800 rounded-3xl space-y-3">
            <Building2 size={36} className="mx-auto text-slate-600" />
            <h3 className="text-lg font-bold text-slate-300">No Shows Available</h3>
            <p className="text-xs text-slate-500">
              No theatres are currently running shows for this movie on the selected date/city.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.values(groupedShowsByTheatre).map(({ theatre, shows: tShows }) => (
              <div
                key={theatre.id}
                className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4 hover:border-slate-700 transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
                  <div className="space-y-1">
                    <Link
                      to={`/theatre/${theatre.id}`}
                      className="text-lg font-extrabold text-white hover:text-rose-400 transition flex items-center gap-2"
                    >
                      <Building2 size={18} className="text-rose-500" />
                      {theatre.name}
                    </Link>
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <MapPin size={12} className="text-slate-500" />
                      {theatre.address}, {theatre.city}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-400">Available Showtimes:</p>
                  <div className="flex flex-wrap gap-3">
                    {tShows.map((s) => (
                      <Link
                        key={s.id}
                        to={`/booking/${s.id}`}
                        className="group/btn px-4 py-3 bg-slate-950 hover:bg-gradient-to-r hover:from-rose-600 hover:to-amber-500 border border-slate-800 hover:border-rose-500 rounded-2xl transition text-left flex flex-col gap-1 min-w-[120px]"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-black text-white flex items-center gap-1">
                            <Clock size={12} className="text-rose-500 group-hover/btn:text-white" />
                            {s.showTime}
                          </span>
                          <span className="text-[10px] font-bold text-amber-400 group-hover/btn:text-white">
                            {s.format}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 group-hover/btn:text-slate-100">
                          <span>{s.screen}</span>
                          <span>{s.availableSeats} seats</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MovieDetails;
