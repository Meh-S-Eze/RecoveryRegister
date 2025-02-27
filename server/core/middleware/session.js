/**
 * Session Middleware
 * Implements secure session management
 * Compatible with privacy-focused authentication system
 */

import session from 'express-session';
import authConfig from '../../features/auth/config.js';

/**
 * Creates a configured session middleware
 * @param {Object} options - Session configuration options
 * @returns {Function} - Configured session middleware
 */
function configureSessionMiddleware(options = {}) {
  console.log('Configuring session middleware with options:', options);
  
  // Default options
  const defaultOptions = {
    secret: process.env.SESSION_SECRET || 'recovery-register-default-key',
    resave: false,
    saveUninitialized: false,
    name: authConfig.identityOptions.session.cookieName || 'recovery_session',
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  };

  // Merge with custom options
  const sessionOptions = { ...defaultOptions, ...options };
  
  console.log('Final session configuration (without secret):', { 
    ...sessionOptions, 
    secret: '[REDACTED]' 
  });
  
  return session(sessionOptions);
}

export default configureSessionMiddleware;