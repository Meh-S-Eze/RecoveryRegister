import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

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

// Add at the top
const clientLogger = {
  error: (message, context) => {
    console.error(`[CLIENT ERROR] ${new Date().toISOString()} - ${message}`, context);
    // Optionally send to error tracking service
  },
  auth: (message, meta) => {
    console.log(`[AUTH] ${new Date().toISOString()} - ${message}`, meta);
  }
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
  const navigate = useNavigate();
  
  // Check if user is authenticated on component mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        clientLogger.auth('Initiating authentication check');
        setLoading(true);
        const response = await fetch(API_ENDPOINTS.profile, {
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache',
            'X-Admin-Check': 'true'
          }
        });
        
        if (response.ok) {
          const userData = await response.json();
          clientLogger.auth('Authentication check successful', userData);
          if (userData.role === 'admin') {
            console.log('Admin session validated');
            setUser(userData);
          } else {
            console.log('Admin privileges required');
            setUser(null);
          }
        } else {
          clientLogger.error('Authentication check failed', {
            status: response.status,
            headers: Object.fromEntries(response.headers.entries())
          });
          setUser(null);
        }
      } catch (err) {
        clientLogger.error('Authentication check error', {
          error: err.message,
          stack: err.stack
        });
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
      
      const response = await axios.post(API_ENDPOINTS.login, credentials, {
        withCredentials: true,
        validateStatus: (status) => status < 500 // Don't throw on 401
      });

      if (response.status === 200) {
        const userData = sanitizeUserData(response.data.user);
        setUser(userData);
        navigate('/dashboard');
        return userData;
      }

      // Handle 401 specifically
      if (response.status === 401) {
        setError('Invalid credentials');
        throw new Error('Invalid credentials');
      }

      throw new Error('Unexpected response from server');
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