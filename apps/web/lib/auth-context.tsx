'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '@/lib/api';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string | null;
  googleId?: string | null;
  facebookId?: string | null;
  createdAt?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, name: string, password: string) => Promise<void>;
  oauthLogin: (data: { provider: 'google' | 'facebook' | 'apple'; email: string; name: string; avatar?: string; providerId?: string }) => Promise<void>;
  setSession: (token: string, user: User) => void;
  updateUser: (updatedUser: Partial<User>) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is already logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const response = await authApi.getMe();
          setUser(response.data);
        } catch (error) {
          localStorage.removeItem('accessToken');
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authApi.login(email, password);
    localStorage.setItem('accessToken', response.data.accessToken);
    setUser(response.data.user);
  };

  const register = async (email: string, name: string, password: string) => {
    const response = await authApi.register(email, name, password);
    localStorage.setItem('accessToken', response.data.accessToken);
    setUser(response.data.user);
  };

  const oauthLogin = async (data: { provider: 'google' | 'facebook' | 'apple'; email: string; name: string; avatar?: string; providerId?: string }) => {
    const response = await authApi.oauthLogin(data);
    localStorage.setItem('accessToken', response.data.accessToken);
    setUser(response.data.user);
  };

  const setSession = (token: string, userObj: User) => {
    localStorage.setItem('accessToken', token);
    setUser(userObj);
  };

  const updateUser = (updatedUser: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...updatedUser } : (updatedUser as User)));
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: user !== null,
        login,
        register,
        oauthLogin,
        setSession,
        updateUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

