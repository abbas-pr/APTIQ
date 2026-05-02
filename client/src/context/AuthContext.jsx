import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import client from '../api/client.js';

const AuthContext = createContext(null);

/**
 * Holds JWT + user profile; persists token in localStorage.
 * Separate flows: user login vs admin login (different API paths, same storage keys for simplicity).
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadMe = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const { data } = await client.get('/auth/me');
      setUser(data.user);
    } catch(err) {
      localStorage.removeItem('token');
      setUser(null);
      console.log(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMe();
  }, [loadMe]);

  const loginUser = async (email, password) => {
    const { data } = await client.post('/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    setUser(data.user);
    return data.user;
  };

  const register = async (name, email, password) => {
    const { data } = await client.post('/auth/register', {name, email, password});
    localStorage.setItem('token', data.token);
    setUser(data.user);
    return (data.user);
  };

  const loginAdmin = async (email, password) => {
    const { data } = await client.post('/auth/admin/login', { email, password });
    localStorage.setItem('token', data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loginUser,
        register,
        loginAdmin,
        logout,
        loadMe,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
