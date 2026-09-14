import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from './ToastContext';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('sphereops_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('sphereops_token') || null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  // Verify and fetch current user on mount
  useEffect(() => {
    const checkAuth = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.get('/auth/me');
        if (res.data?.user) {
          setUser(res.data.user);
          localStorage.setItem('sphereops_user', JSON.stringify(res.data.user));
        }
      } catch (err) {
        console.warn('Authentication token verification failed:', err.message);
        logout();
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [token]);

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      const { token: newToken, user: newUser } = res.data;

      localStorage.setItem('sphereops_token', newToken);
      localStorage.setItem('sphereops_user', JSON.stringify(newUser));

      setToken(newToken);
      setUser(newUser);
      showToast(`Welcome back, ${newUser.name}!`, 'success');
      return newUser;
    } catch (err) {
      showToast(err.message, 'error');
      throw err;
    }
  };

  const register = async (userData) => {
    try {
      const res = await api.post('/auth/register', userData);
      const { token: newToken, user: newUser } = res.data;

      localStorage.setItem('sphereops_token', newToken);
      localStorage.setItem('sphereops_user', JSON.stringify(newUser));

      setToken(newToken);
      setUser(newUser);
      showToast(`Account registered successfully. Welcome, ${newUser.name}!`, 'success');
      return newUser;
    } catch (err) {
      showToast(err.message, 'error');
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('sphereops_token');
    localStorage.removeItem('sphereops_user');
    setToken(null);
    setUser(null);
    showToast('Logged out successfully.', 'info');
  };

  const updateProfile = async (profileData) => {
    try {
      const res = await api.put('/auth/profile', profileData);
      const updatedUser = res.data.user;
      setUser(updatedUser);
      localStorage.setItem('sphereops_user', JSON.stringify(updatedUser));
      showToast('Profile updated successfully.', 'success');
      return updatedUser;
    } catch (err) {
      showToast(err.message, 'error');
      throw err;
    }
  };

  const changePassword = async (passwords) => {
    try {
      await api.put('/auth/change-password', passwords);
      showToast('Password changed successfully.', 'success');
    } catch (err) {
      showToast(err.message, 'error');
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user && !!token,
        isAdmin: user?.role === 'admin',
        isManager: user?.role === 'manager' || user?.role === 'admin',
        isEmployee: user?.role === 'employee',
        login,
        register,
        logout,
        updateProfile,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
