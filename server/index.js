/**
 * Recovery Register Server
 * Main server entry point that integrates all modular components
 * Maintains compatibility with existing UI/UX flow
 */

const express = require('express');
const path = require('path');

// Import modular components
const authRoutes = require('./features/auth/routes');
const configureSessionMiddleware = require('./core/middleware/session');
const authConfig = require('./features/auth/config');
const { sanitizeClientData } = require('./features/auth/utils/clientSanitize');

// Create Express application
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure and apply session middleware
const sessionMiddleware = configureSessionMiddleware();
app.use(sessionMiddleware);

// Set up authentication routes - maintain original URL structure
// This ensures existing frontend code continues to work without modification
app.use('/api/auth', authRoutes);

// Backward compatibility routes - allows old code to work with new structure
// These routes maintain the same URLs as the original implementation
app.use('/auth', authRoutes);

/**
 * Middleware to check if a user is authenticated
 * Can be applied to routes that require authentication
 */
const requireAuth = (req, res, next) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  next();
};

/**
 * Example protected route that requires authentication
 */
app.get('/api/protected', requireAuth, (req, res) => {
  res.json({
    message: 'You have access to this protected resource',
    user: req.session.user
  });
});

/**
 * System status endpoint - useful for health checks and debugging
 * Shows configuration info (non-sensitive) and current privacy settings
 */
app.get('/api/system/status', (req, res) => {
  // Only return non-sensitive configuration
  const safeConfig = {
    allowPseudonyms: authConfig.identityOptions.allowPseudonyms,
    requireEmail: authConfig.identityOptions.requireEmail,
    minPseudonymLength: authConfig.identityOptions.minPseudonymLength,
    autoAnonymous: authConfig.privacySettings.autoAnonymous,
  };
  
  res.json({
    status: 'operational',
    auth: safeConfig,
    environment: process.env.NODE_ENV || 'development'
  });
});

// Serve static frontend assets in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
}

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    message: 'An unexpected error occurred',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Authentication system initialized with ${authConfig.privacySettings.autoAnonymous ? 'automatic' : 'manual'} anonymity detection`);
  if (process.env.NODE_ENV !== 'production') {
    console.log(`API available at http://localhost:${PORT}/api/auth`);
  }
});

// Export the app for testing or importing in other files
module.exports = app; 