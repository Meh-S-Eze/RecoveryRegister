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

/**
 * Register a new user
 * Supports both pseudonymous and email-based registration
 */
router.post('/register', async (req, res) => {
  try {
    const { pseudonym, email, password } = req.body;
    
    // Auto-determine anonymity status based on email presence
    // Users without email are assumed to want anonymity
    const isAnonymous = !email;
    
    // Basic validation
    if (!password) {
      return res.status(400).json({ 
        message: "Password is required for all accounts" 
      });
    }
    
    // For all users, we need either a pseudonym or email
    if (!pseudonym && !email) {
      return res.status(400).json({ 
        message: "Either pseudonym or email is required for registration" 
      });
    }
    
    // Validate pseudonym length if provided
    if (pseudonym && pseudonym.length < authConfig.identityOptions.minPseudonymLength) {
      return res.status(400).json({ 
        message: `Pseudonym must be at least ${authConfig.identityOptions.minPseudonymLength} characters long` 
      });
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Determine identity type
    const identityType = email ? 'email' : 'pseudonym';
    
    // Handle username assignment:
    // 1. If pseudonym is provided, use that as the username
    // 2. If only email is provided, extract username from email
    let username = pseudonym;
    if (!username && email) {
      // Extract the part before @ to use as username
      username = email.split('@')[0];
    }
    
    // Create user
    const userData = {
      username,
      email,
      passwordHash,
      identityType,
      isAnonymous,
      securityProfile: 'basic',
      preferredContact: email ? 'email' : 'pseudonym'
    };
    
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
    const { identifier, password } = req.body;
    
    if (!identifier || !password) {
      return res.status(400).json({ 
        message: "Both identifier (pseudonym or email) and password are required" 
      });
    }
    
    // Here we would normally query the database for the user
    // For this implementation, we'll simulate looking up a user with some added logic
    
    // Is the identifier an email?
    const isEmail = identifier.includes('@');
    
    // Mock user lookup logic - in a real implementation, this would query the database
    // 1. If identifier is an email, we would look up by email OR username derived from email
    // 2. If identifier is not an email, we would look up by username/pseudonym
    
    // This mock simulates finding the user
    const user = {
      id: 1,
      username: isEmail ? identifier.split('@')[0] : identifier,
      passwordHash: await bcrypt.hash(password, 10), // This is just for demonstration
      identityType: isEmail ? 'email' : 'pseudonym',
      email: isEmail ? identifier : null,
      securityProfile: 'basic',
      isAnonymous: !isEmail
    };
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    
    // Sanitize user data before storing in session
    const sanitizedUser = sanitizeClientData(user);
    
    // Set session data
    req.session.user = sanitizedUser;
    
    return res.json({
      message: "Login successful",
      user: sanitizedUser
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Error during login" });
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
  if (!req.session || !req.session.user) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  
  return res.json(req.session.user);
});

module.exports = router; 