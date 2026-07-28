import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('ai_saas_jwt_token') || '');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Set default authorization header on Axios
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('ai_saas_jwt_token', token);
      fetchUserProfile();
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('ai_saas_jwt_token');
      setUser(null);
      setLoading(false);
    }
  }, [token]);

  const fetchUserProfile = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/me`);
      if (response.data?.success) {
        setUser(response.data.user);
      }
    } catch (err) {
      console.warn('[Auth Profile Error]', err.response?.data?.error || err.message);
      // If token expired, clear state
      if (err.response?.status === 401) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, { email, password });
    if (response.data?.success) {
      setToken(response.data.token);
      setUser(response.data.user);
    }
    return response.data;
  };

  const register = async (name, email, password, avatarColor) => {
    const response = await axios.post(`${API_BASE_URL}/auth/register`, { name, email, password, avatarColor });
    if (response.data?.success) {
      setToken(response.data.token);
      setUser(response.data.user);
    }
    return response.data;
  };

  const logout = () => {
    setToken('');
    setUser(null);
    localStorage.removeItem('ai_saas_jwt_token');
  };

  return (
    <AuthContext.Provider value={{
      token,
      user,
      loading,
      login,
      register,
      logout,
      refreshUser: fetchUserProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
