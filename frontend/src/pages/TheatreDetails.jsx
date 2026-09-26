import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { requestGraphQL } from '../utils/graphqlClient';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { Building2, MapPin, Phone, Mail, Calendar, Clock, Film, Ticket, ChevronRight } from 'lucide-react';

const GET_THEATRE_DETAILS = `
  query GetTheatreDetails($id: ID!, $showDate: String) {
    theatre(id: $id) {
      id
      name
      description
      address
      city
      state
      pincode
      phone
      email
      image
      screens {
        id
        name
        screenType
        totalSeats
      }
    }
    showsByTheatre(theatreId: $id, showDate: $showDate) {
      id
      showDate
      showTime
      screen
      language
      format
      availableSeats
      totalSeats
      price
      movie {
        id
        title
        genre
        duration
        rating
        minimumAge
        thumbnail
      }
    }
  }
`;

const TheatreDetails = () => {
  const { id } = useParams();
  const [theatre, setTheatre] = useState(null);
  const [shows, setShows] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, [id, selectedDate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await requestGraphQL(GET_THEATRE_DETAILS, {
        id,
        showDate: selectedDate,
      });
      setTheatre(data.theatre);
      setShows(data.showsByTheatre || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Group shows by movie
  const groupedShowsByMovie = shows.reduce((acc, show) => {
    if (!show.movie) return acc;
    const movieId = show.movie.id;
    if (!acc[movieId]) {
      acc[movieId] = {
        movie: show.movie,
        shows: [],
      };
    }
    acc[movieId].shows.push(show);
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

  if (loading) return <LoadingSpinner message="Fetching theatre & movies..." />;
  if (error) return <ErrorMessage message={error} />;
  if (!theatre) return <ErrorMessage message="Theatre not found." />;

  return (
    <div className="space-y-8 pb-16">
      {/* Theatre Header */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-800 bg-slate-900 shadow-2xl">
        <div className="relative h-64 sm:h-80 overflow-hidden">
          <img src={theatre.image} alt={theatre.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
        </div>

        <div className="p-6 sm:p-10 -mt-24 relative z-10 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 bg-rose-600 text-white text-xs font-black uppercase tracking-wider rounded-xl">
              {theatre.city}
            </span>
            {theatre.screens?.map((scr) => (
              <span key={scr.id} className="px-3 py-1 bg-slate-800 text-slate-300 border border-slate-700 text-xs font-bold rounded-xl">
                {scr.name} ({scr.screenType})
              </span>
            ))}
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white">{theatre.name}</h1>
          <p className="text-slate-300 text-sm max-w-3xl">{theatre.description}</p>

          <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-slate-800 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-rose-500" />
              <span>{theatre.address}, {theatre.city}, {theatre.state} - {theatre.pincode}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone size={16} className="text-rose-500" />
              <span>{theatre.phone}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail size={16} className="text-rose-500" />
              <span>{theatre.email}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Date Selector */}
      <div className="bg-slate-900/90 border border-slate-800 p-4 sm:p-6 rounded-3xl space-y-4">
        <h2 className="text-xs font-extrabold uppercase tracking-wider text-rose-400 flex items-center gap-2">
          <Calendar size={16} />
          Select Show Date
        </h2>
        <div className="flex items-center gap-3">
          {datesList.map((d) => (
            <button
              key={d.dateStr}
              onClick={() => setSelectedDate(d.dateStr)}
              className={`px-5 py-3 rounded-2xl font-bold text-xs transition flex flex-col items-center gap-0.5 ${
                selectedDate === d.dateStr
                  ? 'bg-gradient-to-r from-rose-600 to-amber-500 text-white shadow-lg shadow-rose-600/30'
                  : 'bg-slate-950 text-slate-300 border border-slate-800 hover:bg-slate-800'
              }`}
            >
              <span className="text-sm font-black">{d.dayName}</span>
              <span className="text-[10px] opacity-80">{d.formattedDate}</span>
            </button>
          ))}
        </div>
      </div>

      {/* MOVIES SHOWING AT THIS THEATRE */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-2xl font-black text-white">MOVIES SHOWING AT THIS THEATRE</h2>
            <p className="text-xs text-slate-400">Available showtimes at {theatre.name}</p>
          </div>
        </div>

        {Object.keys(groupedShowsByMovie).length === 0 ? (
          <div className="p-12 text-center bg-slate-900/50 border border-slate-800 rounded-3xl space-y-3">
            <Film size={36} className="mx-auto text-slate-600" />
            <h3 className="text-lg font-bold text-slate-300">No Shows Available for Selected Date</h3>
            <p className="text-xs text-slate-500">Please pick another date or explore other theatres.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.values(groupedShowsByMovie).map(({ movie, shows: movieShows }) => (
              <div
                key={movie.id}
                className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 flex flex-col md:flex-row gap-6 items-start hover:border-slate-700 transition"
              >
                <img
                  src={movie.thumbnail}
                  alt={movie.title}
                  className="w-full md:w-32 h-44 object-cover rounded-2xl shrink-0 shadow-lg"
                />

                <div className="flex-1 space-y-4 w-full">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 bg-rose-600/20 text-rose-400 border border-rose-600/30 text-[10px] font-black rounded-lg">
                        {movie.rating} ({movie.minimumAge}+)
                      </span>
                      <span className="text-xs text-slate-400">{movie.genre}</span>
                      <span className="text-xs text-slate-400">• {movie.duration} mins</span>
                    </div>
                    <Link to={`/movie/${movie.id}`} className="text-xl font-black text-white hover:text-rose-400 transition">
                      {movie.title}
                    </Link>
                  </div>

                  {/* Showtimes List */}
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-slate-400">Available Showtimes:</p>
                    <div className="flex flex-wrap gap-3">
                      {movieShows.map((s) => (
                        <Link
                          key={s.id}
                          to={`/booking/${s.id}`}
                          className="group/btn px-4 py-3 bg-slate-950 hover:bg-gradient-to-r hover:from-rose-600 hover:to-amber-500 border border-slate-800 hover:border-rose-500 rounded-2xl transition text-left flex flex-col gap-1 min-w-[120px]"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-black text-white group-hover/btn:text-white flex items-center gap-1">
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TheatreDetails;
