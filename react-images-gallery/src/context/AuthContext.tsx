import React, { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role?: string;
}

interface AuthContextProps {
  isAuthenticated: boolean;
  user: User | null;
  login: (token: string, userData: User) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextProps | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return Boolean(localStorage.getItem('token'));
  });
  
  const [user, setUser] = useState<User | null>(() => {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  });

  // Vérifie l'authentification au montage et synchronise l'état
  const refreshAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');
      
      const response = await axios.get("http://localhost:5000/api/v1/users/me", { 
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true
      });

      setIsAuthenticated(true);
      setUser(response.data.user);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    } catch (error) {
      clearAuthState();
    }
  };

  useEffect(() => {
    refreshAuth();
  }, []);

  const clearAuthState = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const login = async (token: string, userData: User) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setIsAuthenticated(true);
    setUser(userData);
    await refreshAuth(); // Synchronisation immédiate
  };

  const logout = async () => {
    try {
      await axios.post("http://localhost:5000/api/v1/users/logout", {}, {
        withCredentials: true
      });
      setUser(null);
      localStorage.removeItem('token'); 
    } finally {
      clearAuthState();
      // Force un refresh des données protégées
      window.dispatchEvent(new Event('storage'));
    }
  };

  // Écoute les changements de localStorage depuis d'autres onglets
  useEffect(() => {
    const handleStorageChange = () => {
      const token = localStorage.getItem('token');
      if (!token) {
        clearAuthState();
      } else if (!isAuthenticated) {
        refreshAuth();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [isAuthenticated]);

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      user,
      login,
      logout,
      refreshAuth
    }}>
      {children}
    </AuthContext.Provider>
  );
};

