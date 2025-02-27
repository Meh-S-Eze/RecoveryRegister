import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '@/lib/apiClient';

interface User {
  id: number;
  username?: string;
  email?: string;
  identityType: 'pseudonym' | 'email' | 'oauth';
  isAnonymous: boolean;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  register: (data: any) => Promise<any>;
  login: (credentials: { identifier: string; password: string }) => Promise<any>;
  logout: () => Promise<void>;
  isAnonymous: () => boolean;
  isAuthenticated: () => boolean;
  getIdentityType: () => string | null;
}

// Create the context
const AuthContext = createContext<AuthContextType | null>(null);

/**
 * AuthProvider component that wraps the application
 * and provides authentication state and methods
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Authentication state
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Check if user is authenticated on component mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(true);
        const userData = await apiClient.auth.getProfile();
        setUser(userData);
      } catch (err) {
        // Not authenticated, but not an error
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);
  
  /**
   * Register a new user
   */
  const register = async (data: any) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await apiClient.auth.register(data);
      setUser(result.user);
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Login a user
   */
  const login = async (credentials: { identifier: string; password: string }) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await apiClient.auth.login(credentials);
      setUser(result.user);
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Logout the current user
   */
  const logout = async () => {
    try {
      setLoading(true);
      await apiClient.auth.logout();
      setUser(null);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Check if the current user is anonymous
   */
  const isAnonymous = () => {
    return user?.isAnonymous || false;
  };
  
  /**
   * Check if the current user is authenticated
   */
  const isAuthenticated = () => {
    return !!user;
  };
  
  /**
   * Get the user's identity type
   */
  const getIdentityType = () => {
    return user?.identityType || null;
  };
  
  // Context value
  const value = {
    user,
    loading,
    error,
    register,
    login,
    logout,
    isAnonymous,
    isAuthenticated,
    getIdentityType,
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook to use the auth context
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export default AuthContext; 