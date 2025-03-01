/**
 * Authentication Routes
 * Implements privacy-focused, flexible authentication compatible with Celebrate Recovery principles
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const { UserSchema, createUser } = require('./model');
const { sanitizeClientData } = require('./utils/clientSanitize');
const authConfig = require('./config');
const { authLogger, logRequest, logError } = require('../../core/utils/logger');

/**
 * Register a new user
 * Supports both pseudonymous and email-based registration
 */
router.post('/register', async (req, res) => {
  try {
    const { identifier, password } = req.body;
    
    // Auto-determine anonymity status based on email presence
    // Users without email are assumed to want anonymity
    const isAnonymous = !req.body.email;
    
    // Basic validation
    if (!password) {
      return res.status(400).json({ 
        message: "Password is required for all accounts" 
      });
    }
    
    // For all users, we need either a pseudonym or email
    if (!req.body.pseudonym && !req.body.email) {
      return res.status(400).json({ 
        message: "Either pseudonym or email is required for registration" 
      });
    }
    
    // Validate pseudonym length if provided
    if (req.body.pseudonym && req.body.pseudonym.length < authConfig.identityOptions.minPseudonymLength) {
      return res.status(400).json({ 
        message: `Pseudonym must be at least ${authConfig.identityOptions.minPseudonymLength} characters long` 
      });
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Determine identity type
    const identityType = req.body.email ? 'email' : 'pseudonym';
    
    // Handle username assignment:
    // 1. If pseudonym is provided, use that as the username
    // 2. If only email is provided, extract username from email
    let username = req.body.pseudonym;
    if (!username && req.body.email) {
      // Extract the part before @ to use as username
      username = req.body.email.split('@')[0];
    }
    
    // Create user
    const userData = {
      username,
      email: req.body.email,
      passwordHash,
      identityType,
      isAnonymous,
      securityProfile: 'basic',
      preferredContact: req.body.email ? 'email' : 'pseudonym'
    };

    if (identifier.includes('@')) {
      // Treat as email registration
      userData.email = identifier;
      userData.pseudonym = null;
    } else {
      // Treat as pseudonym registration
      userData.pseudonym = identifier;
      userData.email = null;
    }

    const user = createUser(userData);
    
    // Here we would normally save the user to the database
    // But for our implementation, we'll just use the user object directly
    
    // Sanitize user data before storing in session
    const sanitizedUser = sanitizeClientData(user);
    
    // Set session data
    req.session.user = sanitizedUser;
    
    return res.status(201).json({
      message: "Registration successful",
      user: sanitizedUser
    });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({ message: "Error during registration" });
  }
});

/**
 * Login a user
 * Supports login with either pseudonym or email, even if user registered with only one
 */
router.post('/login', async (req, res) => {
  try {
    logRequest(req);
    const user = await authenticateUser(req.body.identifier, req.body.password);
    
    req.session.regenerate((err) => {
      if (err) {
        logError(err, { phase: 'session-regeneration' });
        return res.status(500).json({ message: 'Authentication error' });
      }

      authLogger.info('User login successful', {
        userId: user.id,
        authMethod: user.identityType,
        isAnonymous: user.isAnonymous
      });

      req.session.user = {
        id: user.id,
        pseudonym: user.pseudonym,
        securityProfile: user.securityProfile,
        isAnonymous: user.isAnonymous
      };

      // Send JSON response instead of redirect
      return res.status(200).json({
        message: "Login successful",
        user: sanitizeClientData(user)
      });
    });
    
  } catch (error) {
    logError(error, {
      identifier: req.body.identifier,
      clientIp: req.ip
    });
    return res.status(401).json({ message: "Invalid credentials" });
  }
});

/**
 * Logout a user
 */
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).json({ message: "Error during logout" });
    }
    
    return res.status(200).json({ message: "Logged out successfully" });
  });
});

/**
 * Get current user profile
 */
router.get('/me', (req, res) => {
  if (!req.session?.user) {
    console.log('Session check failed - no user in session:', req.session);
    return res.status(401).json({ message: "Not authenticated" });
  }
  
  console.log('Session check successful for user:', req.session.user.id);
  return res.json({
    ...req.session.user,
    sessionId: req.sessionID // For debugging
  });
});

/**
 * Admin login route
 */
router.post('/admin/login', validateLogin, async (req, res) => {
  try {
    authLogger.info('Admin login attempt', { 
      identifier: req.body.identifier,
      identifierType: req.body.identifier.includes('@') ? 'email' : 'pseudonym'
    });
    
    const user = await authenticateAdmin(req.body.identifier, req.body.password);
    
    req.session.regenerate((err) => {
      if (err) {
        authLogger.error('Admin session regeneration failed', {
          error: err.message,
          stack: err.stack
        });
        return res.status(500).json({ message: 'Authentication error' });
      }

      authLogger.warn('Admin login successful', {
        userId: user.id,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      });

      req.session.user = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: 'admin',
        securityProfile: 'admin',
        isAnonymous: false,
        adminToken: generateAdminToken(user.id) // Add admin-specific token
      };

      console.log('Admin session created:', req.sessionID);
      return res.status(200).json({
        message: "Admin login successful",
        user: sanitizeClientData(user)
      });
    });
    
  } catch (error) {
    authLogger.error('Admin login failed', {
      identifier: req.body.identifier,
      error: error.message,
      validationDetails: {
        expectedPattern: 'email (user@domain.com) or pseudonym (3-20 chars)',
        receivedValue: req.body.identifier
      }
    });
    return res.status(401).json({ message: "Invalid admin credentials" });
  }
});

// Add this route above the regular admin login
router.post('/dev-admin-login', (req, res) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({ message: "Access denied" });
  }

  // Create mock admin session
  req.session.regenerate((err) => {
    if (err) {
      console.error("Dev session error:", err);
      return res.status(500).json({ message: 'Dev login failed' });
    }

    req.session.user = {
      id: -1,
      username: 'devadmin',
      email: 'devadmin@localhost',
      role: 'super_admin',
      securityProfile: 'admin',
      isAnonymous: false,
      adminToken: 'dev-bypass-token'
    };

    res.json({
      message: "Development admin access granted",
      user: {
        id: -1,
        role: 'super_admin',
        isAnonymous: false
      }
    });
  });
});

// Add debug endpoint
router.get('/session/debug', (req, res) => {
  res.json({
    sessionId: req.sessionID,
    user: req.session.user,
    cookies: req.headers.cookie,
    headers: req.headers
  });
});

// Update the validateLogin middleware to accept both email and pseudonym formats
const validateLogin = (req, res, next) => {
  // Capture raw input for debugging
  const rawIdentifier = req.body.identifier;
  const sanitizedIdentifier = String(rawIdentifier).trim();

  authLogger.debug('Login input validation', {
    rawIdentifier,
    sanitizedIdentifier,
    length: sanitizedIdentifier.length,
    type: typeof rawIdentifier
  });

  const identifierPattern = /^(?:[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|[a-zA-Z0-9_-]{3,20})$/;
  
  if (!identifierPattern.test(sanitizedIdentifier)) {
    authLogger.error('Invalid identifier format', {
      rawIdentifier,
      sanitizedIdentifier,
      pattern: identifierPattern.toString(),
      length: sanitizedIdentifier.length,
      type: typeof rawIdentifier
    });
    return res.status(400).json({ 
      message: "Invalid format. Use email or 3-20 character pseudonym (letters, numbers, _-)" 
    });
  }
  
  if (typeof req.body.password !== 'string' || req.body.password.length < 8) {
    return res.status(400).json({ 
      message: "Password must be at least 8 characters" 
    });
  }
  
  next();
};

// Update the authenticateAdmin function (or create a mock version)
const authenticateAdmin = async (identifier, password) => {
  if (process.env.NODE_ENV === 'development' && 
      identifier === 'devadmin@localhost' &&
      password === 'devpassword123') {
    return {
      id: -1,
      username: 'devadmin',
      email: 'devadmin@localhost',
      role: 'super_admin',
      securityProfile: 'admin'
    };
  }
  
  // ... existing authentication logic ...
};

module.exports = router; 