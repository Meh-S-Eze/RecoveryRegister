/**
 * Authentication Service
 * Handles all API requests related to authentication
 */

// API endpoints
const API_ENDPOINTS = {
  login: '/api/auth/login',
  register: '/api/auth/register',
  logout: '/api/auth/logout',
  profile: '/api/auth/me',
  passwordReset: '/api/auth/reset-password',
  systemStatus: '/api/system/status'
};

/**
 * Default fetch options for all requests
 */
const defaultOptions = {
  headers: {
    'Content-Type': 'application/json'
  },
  credentials: 'include' // Include cookies in requests
};

/**
 * Handle API errors consistently
 * @param {Response} response - Fetch response
 * @returns {Promise} - Resolved with JSON data or rejected with error
 */
const handleResponse = async (response) => {
  const data = await response.json();
  
  if (!response.ok) {
    const error = new Error(data.message || 'An error occurred');
    error.statusCode = response.status;
    error.responseData = data;
    throw error;
  }
  
  return data;
};

/**
 * Authentication API service methods
 */
const authService = {
  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Promise} - User data
   */
  register: async (userData) => {
    const response = await fetch(API_ENDPOINTS.register, {
      ...defaultOptions,
      method: 'POST',
      body: JSON.stringify(userData)
    });
    
    return handleResponse(response);
  },
  
  /**
   * Login a user
   * @param {Object} credentials - Login credentials
   * @returns {Promise} - User data
   */
  login: async (credentials) => {
    const response = await fetch(API_ENDPOINTS.login, {
      ...defaultOptions,
      method: 'POST',
      body: JSON.stringify(credentials)
    });
    
    return handleResponse(response);
  },
  
  /**
   * Logout a user
   * @returns {Promise} - Success message
   */
  logout: async () => {
    const response = await fetch(API_ENDPOINTS.logout, {
      ...defaultOptions,
      method: 'POST'
    });
    
    return handleResponse(response);
  },
  
  /**
   * Get authenticated user profile
   * @returns {Promise} - User data or null if not authenticated
   */
  getProfile: async () => {
    try {
      const response = await fetch(API_ENDPOINTS.profile, {
        ...defaultOptions,
        method: 'GET'
      });
      
      if (response.status === 401) {
        return null; // Not authenticated
      }
      
      return handleResponse(response);
    } catch (error) {
      console.error('Profile fetch error:', error);
      return null;
    }
  },
  
  /**
   * Request password reset
   * @param {Object} data - Reset request data
   * @returns {Promise} - Success message
   */
  requestPasswordReset: async (data) => {
    const response = await fetch(`${API_ENDPOINTS.passwordReset}/request`, {
      ...defaultOptions,
      method: 'POST',
      body: JSON.stringify(data)
    });
    
    return handleResponse(response);
  },
  
  /**
   * Reset password with token
   * @param {Object} data - New password and token
   * @returns {Promise} - Success message
   */
  resetPassword: async (data) => {
    const response = await fetch(API_ENDPOINTS.passwordReset, {
      ...defaultOptions,
      method: 'POST',
      body: JSON.stringify(data)
    });
    
    return handleResponse(response);
  },
  
  /**
   * Get system status and configuration
   * @returns {Promise} - System status data
   */
  getSystemStatus: async () => {
    const response = await fetch(API_ENDPOINTS.systemStatus, {
      ...defaultOptions,
      method: 'GET'
    });
    
    return handleResponse(response);
  }
};

export default authService; 