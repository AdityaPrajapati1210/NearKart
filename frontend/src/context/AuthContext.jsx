import React, { createContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('nk_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('nk_token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const profile = await authService.getProfile();
        if (profile) {
          setUser(profile);
          setToken('session_active');
        } else {
          // If profile check returns null (401), clean up
          setUser(null);
          setToken(null);
        }
      } catch (err) {
        console.warn('Session profile check:', err.message);
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const login = async (identifier, password) => {
    setLoading(true);
    setError(null);
    try {
      const loggedUser = await authService.login(identifier, password);
      setUser(loggedUser);
      setToken('session_active');
      return loggedUser;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, mobile, password, role = 'customer') => {
    setLoading(true);
    setError(null);
    try {
      const registeredUser = await authService.register(name, email, mobile, password, role);
      setUser(registeredUser);
      setToken('session_active');
      return registeredUser;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
      setToken(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, error, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};
