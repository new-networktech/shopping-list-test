'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { getToken, setToken, removeToken, getUser, setUser as saveUser, User } from '../lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8185';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUserState] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Load user on mount
  useEffect(() => {
    const loadUser = async () => {
      const token = getToken();
      const savedUser = getUser();
      
      if (token && savedUser) {
        setUserState(savedUser);
        // Verify token is still valid
        try {
          const response = await axios.get('/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (response.data.id !== savedUser.id) {
            // Update user if data changed
            saveUser(response.data);
            setUserState(response.data);
          }
        } catch (error) {
          // Token invalid, clear auth
          removeToken();
          setUserState(null);
        }
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      // Login request
      const response = await axios.post('/api/auth/login', {
        username,
        password
      });

      const { access_token } = response.data;
      setToken(access_token);

      // Get user info
      const userResponse = await axios.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${access_token}` }
      });

      saveUser(userResponse.data);
      setUserState(userResponse.data);

      // Redirect based on role
      if (userResponse.data.is_admin) {
        router.push('/admin');
      } else {
        router.push('/');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Extract error message properly
      let errorMessage = 'Login failed'
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error
      } else if (error.response?.data?.detail) {
        const detail = error.response.data.detail
        if (Array.isArray(detail)) {
          errorMessage = detail.map((err: any) => err.msg || err.message || JSON.stringify(err)).join(', ')
        } else {
          errorMessage = detail
        }
      } else if (error.message) {
        errorMessage = error.message
      }
      
      throw new Error(errorMessage);
    }
  };

  const logout = () => {
    removeToken();
    setUserState(null);
    router.push('/login');
  };

  const refreshUser = async () => {
    const token = getToken();
    if (!token) return;

    try {
      const response = await axios.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      saveUser(response.data);
      setUserState(response.data);
    } catch (error) {
      console.error('Failed to refresh user:', error);
      logout();
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

