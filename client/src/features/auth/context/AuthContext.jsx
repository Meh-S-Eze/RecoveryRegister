import React, { createContext, useContext, useState, useEffect } from 'react';

/**
 * Authentication Context
 * Manages authentication state and privacy settings
 * Provides privacy mode switching and client-side data sanitization
 */

// Create the context
const AuthContext = createContext(null);

// API endpoints
const API_ENDPOINTS = {
  login: '/api/auth/login',
  register: '/api/auth/register',
  logout: '/api/auth/logout',
  profile: '/api/auth/me',
};

/**
 * AuthProvider component that wraps the application
 * and provides authentication state and methods
 */
export const AuthProvider = ({ children }) => {
  // Authentication state
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Check if user is authenticated on component mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(true);
        const response = await fetch(API_ENDPOINTS.profile, {
          credentials: 'include',
        });
        
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          // Not authenticated, but not an error
          setUser(null);
        }
      } catch (err) {
        console.error('Auth check error:', err);
        setError('Failed to check authentication status');
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);
  
  /**
   * Register a new user
   * @param {Object} data - Registration data (pseudonym/email and password)
   */
  const register = async (data) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(API_ENDPOINTS.register, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Registration failed');
      }
      
      setUser(result.user);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Login a user
   * @param {Object} credentials - Login credentials (identifier and password)
   */
  const login = async (credentials) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(API_ENDPOINTS.login, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
        credentials: 'include',
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Login failed');
      }
      
      setUser(result.user);
      return result;
    } catch (err) {
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
      
      const response = await fetch(API_ENDPOINTS.logout, {
        method: 'POST',
        credentials: 'include',
      });
      
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || 'Logout failed');
      }
      
      setUser(null);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Check if the current user is anonymous
   * @returns {boolean} - True if user is anonymous
   */
  const isAnonymous = () => {
    return user?.isAnonymous || false;
  };
  
  /**
   * Check if the current user is authenticated
   * @returns {boolean} - True if user is authenticated
   */
  const isAuthenticated = () => {
    return !!user;
  };
  
  /**
   * Get the user's identity type (pseudonym or email)
   * @returns {string} - Identity type
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
 * @returns {Object} - Auth context
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export default AuthContext; 