import React, { createContext, useState, useEffect, useContext } from 'react';
import { requestGraphQL } from '../utils/graphqlClient';

const AuthContext = createContext();

const ME_QUERY = `
  query Me {
    me {
      id
      name
      email
      phone
      age
      role
      theatreId
      isActive
      theatre {
        id
        name
        city
      }
    }
  }
`;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('cinebook_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMe = async () => {
      if (token) {
        try {
          const data = await requestGraphQL(ME_QUERY);
          setUser(data.me);
        } catch (err) {
          console.error('Session expired or invalid:', err.message);
          localStorage.removeItem('cinebook_token');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    fetchMe();
  }, [token]);

  const login = (newToken, userData) => {
    localStorage.setItem('cinebook_token', newToken);
    setToken(newToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('cinebook_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        isAdmin: user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN',
        isSuperAdmin: user?.role === 'SUPER_ADMIN',
        isTheatreAdmin: user?.role === 'ADMIN',
        theatreId: user?.theatreId,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
