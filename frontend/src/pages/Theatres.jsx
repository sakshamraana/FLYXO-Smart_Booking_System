import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { requestGraphQL } from '../utils/graphqlClient';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { Building2, MapPin, Phone, Mail, ArrowRight, Film } from 'lucide-react';

const GET_THEATRES_QUERY = `
  query GetTheatres($city: String) {
    theatres(city: $city) {
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
      }
    }
    cities
  }
`;

const Theatres = () => {
  const [theatres, setTheatres] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTheatres();
  }, [selectedCity]);

  const fetchTheatres = async () => {
    try {
      setLoading(true);
      const data = await requestGraphQL(GET_THEATRES_QUERY, {
        city: selectedCity || null,
      });
      setTheatres(data.theatres || []);
      setCities(data.cities || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading theatres near you..." />;

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-slate-900 via-rose-950/40 to-slate-900 border border-slate-800 p-8 sm:p-12">
        <div className="max-w-2xl space-y-4">
          <span className="px-3 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-black uppercase tracking-wider rounded-full inline-block">
            Theatre Discovery
          </span>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Find Cinemas Near You
          </h1>
          <p className="text-slate-400 text-sm sm:text-base">
            Select your city to explore luxury multiplexes, IMAX screens, and 4DX immersive theatres.
          </p>
        </div>

        {/* City Filter Pills */}
        <div className="mt-8 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSelectedCity('')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              selectedCity === ''
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                : 'bg-slate-950/80 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <Building2 size={14} />
            All Cities
          </button>
          {cities.map((city) => (
            <button
              key={city}
              onClick={() => setSelectedCity(city)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                selectedCity === city
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                  : 'bg-slate-950/80 text-slate-300 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <MapPin size={14} />
              {city}
            </button>
          ))}
        </div>
      </div>

      <ErrorMessage message={error} />

      {/* Theatres Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {theatres.map((th) => (
          <div
            key={th.id}
            className="group bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-xl hover:border-rose-500/50 transition duration-300 flex flex-col justify-between"
          >
            <div>
              <div className="relative h-48 overflow-hidden">
                <img
                  src={th.image}
                  alt={th.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
                <span className="absolute top-4 right-4 px-3 py-1 bg-slate-950/80 backdrop-blur-md text-amber-400 border border-amber-500/20 text-xs font-bold rounded-xl flex items-center gap-1">
                  <MapPin size={12} />
                  {th.city}
                </span>
              </div>

              <div className="p-6 space-y-3">
                <h3 className="text-xl font-extrabold text-white group-hover:text-rose-400 transition">
                  {th.name}
                </h3>
                <p className="text-xs text-slate-400 line-clamp-2">{th.description}</p>
                <div className="text-xs text-slate-400 space-y-1 pt-2 border-t border-slate-800/80">
                  <p className="flex items-center gap-2">
                    <MapPin size={14} className="text-rose-500 shrink-0" />
                    <span className="truncate">{th.address}, {th.pincode}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone size={14} className="text-rose-500 shrink-0" />
                    <span>{th.phone}</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 pt-0">
              <Link
                to={`/theatre/${th.id}`}
                className="w-full py-3 bg-slate-950 hover:bg-rose-600 text-slate-200 hover:text-white font-bold rounded-2xl border border-slate-800 hover:border-rose-600 transition flex items-center justify-center gap-2 text-xs"
              >
                <span>View Movies & Showtimes</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Theatres;
