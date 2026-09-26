import React, { useState, useEffect } from 'react';
import { requestGraphQL } from '../utils/graphqlClient';
import MovieGrid from '../components/MovieGrid';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { Film, Sparkles, MapPin, Building2, Ticket, Search } from 'lucide-react';
import { Link } from 'react-router-dom';

const GET_HOME_DATA = `
  query GetHomeData($city: String) {
    movies(includeInactive: false) {
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
      isActive
      shows {
        id
        theatreId
        showDate
      }
    }
    theatres(city: $city) {
      id
      name
      city
      address
      image
    }
    cities
  }
`;

const Home = () => {
  const [movies, setMovies] = useState([]);
  const [theatres, setTheatres] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('ALL');
  const [activeTab, setActiveTab] = useState('movies');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, [selectedCity]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await requestGraphQL(GET_HOME_DATA, {
        city: selectedCity || null,
      });
      setMovies(data.movies || []);
      setTheatres(data.theatres || []);
      setCities(data.cities || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const genres = ['ALL', ...new Set(movies.map((m) => m.genre).filter(Boolean))];

  const filteredMovies = movies.filter((m) => {
    const matchesSearch =
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.genre.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGenre = selectedGenre === 'ALL' || m.genre === selectedGenre;
    return matchesSearch && matchesGenre;
  });

  if (loading) return <LoadingSpinner message="Fetching movies & theatres..." />;

  return (
    <div className="space-y-10 pb-16">
      {/* Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-slate-900 via-rose-950/40 to-slate-900 border border-slate-800 p-8 sm:p-12 shadow-2xl">
        <div className="max-w-3xl space-y-5">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-rose-600/20 text-rose-400 border border-rose-500/30 text-xs font-black uppercase tracking-wider rounded-full flex items-center gap-1">
              <Sparkles size={12} className="text-amber-400" />
              Real-Time Movie Ticket System
            </span>

            {/* City Selector */}
            <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-full px-3 py-1 text-xs font-bold text-slate-300">
              <MapPin size={12} className="text-rose-500" />
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="" className="bg-slate-900">All Cities</option>
                {cities.map((city) => (
                  <option key={city} value={city} className="bg-slate-900">
                    {city}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight">
            Book Tickets across <span className="text-rose-500">Multiple Theatres</span>
          </h1>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Choose your movie, pick your favourite theatre in your city, and select custom seats in real-time with instant Socket.io seat locking!
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => setActiveTab('movies')}
              className={`px-5 py-2.5 rounded-2xl text-xs font-black transition flex items-center gap-2 ${
                activeTab === 'movies'
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                  : 'bg-slate-950 text-slate-300 border border-slate-800 hover:bg-slate-800'
              }`}
            >
              <Film size={15} />
              Explore Movies
            </button>
            <button
              onClick={() => setActiveTab('theatres')}
              className={`px-5 py-2.5 rounded-2xl text-xs font-black transition flex items-center gap-2 ${
                activeTab === 'theatres'
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                  : 'bg-slate-950 text-slate-300 border border-slate-800 hover:bg-slate-800'
              }`}
            >
              <Building2 size={15} />
              Explore Theatres ({theatres.length})
            </button>
          </div>
        </div>
      </div>

      <ErrorMessage message={error} />

      {activeTab === 'movies' ? (
        <div className="space-y-6">
          {/* Search & Genre Filters */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-900/90 border border-slate-800 p-4 rounded-3xl">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-3 text-slate-500" size={18} />
              <input
                type="text"
                placeholder="Search movies or genres..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-2xl pl-10 pr-4 py-2 text-xs text-slate-200 focus:outline-none transition"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              {genres.map((g) => (
                <button
                  key={g}
                  onClick={() => setSelectedGenre(g)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    selectedGenre === g
                      ? 'bg-rose-600 text-white'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <MovieGrid movies={filteredMovies} />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-xl font-black text-white">Theatres in {selectedCity || 'All Cities'}</h2>
            <Link to="/theatres" className="text-xs font-bold text-rose-400 hover:underline">
              View All Theatres →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {theatres.map((th) => (
              <div
                key={th.id}
                className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden hover:border-rose-500/50 transition duration-300 p-5 space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="h-40 rounded-2xl overflow-hidden">
                    <img src={th.image} alt={th.name} className="w-full h-full object-cover" />
                  </div>
                  <h3 className="text-lg font-bold text-white">{th.name}</h3>
                  <p className="text-xs text-slate-400 flex items-center gap-1">
                    <MapPin size={12} className="text-rose-500" />
                    {th.address}, {th.city}
                  </p>
                </div>
                <Link
                  to={`/theatre/${th.id}`}
                  className="w-full py-2.5 bg-slate-950 hover:bg-rose-600 text-slate-200 hover:text-white text-xs font-bold rounded-xl border border-slate-800 hover:border-rose-600 transition text-center block"
                >
                  View Movies & Showtimes
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
