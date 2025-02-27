/**
 * Session Middleware
 * Implements secure session management with encryption capabilities
 * Compatible with privacy-focused authentication system
 */

const session = require('express-session');
const crypto = require('crypto');

// Import auth configuration to access session settings
const authConfig = require('../../features/auth/config');

/**
 * Basic encryption utility for client-side data
 * Provides a foundational level of protection while maintaining simplicity
 */
class SimpleEncryption {
  constructor(options = {}) {
    this.algorithm = options.algorithm || authConfig.identityOptions.session.clientSideEncryption.algorithm || 'aes-128-cbc';
    this.secretKey = options.secretKey || process.env.SESSION_SECRET || 'recovery-register-default-key';
    // Generate a fixed IV for simplicity in this implementation
    // In production, a unique IV would be generated for each encryption
    this.iv = crypto.createHash('sha256').update(this.secretKey).digest().slice(0, 16);
  }

  /**
   * Encrypts session data
   * @param {Object} data - Data to encrypt
   * @returns {string} - Encrypted data
   */
  encrypt(data) {
    try {
      const cipher = crypto.createCipheriv(this.algorithm, Buffer.from(this.secretKey).slice(0, 16), this.iv);
      const encrypted = Buffer.concat([cipher.update(JSON.stringify(data)), cipher.final()]);
      return encrypted.toString('base64');
    } catch (error) {
      console.error('Session encryption error:', error);
      // Fallback to unencrypted JSON in case of encryption failure
      return JSON.stringify(data);
    }
  }

  /**
   * Decrypts session data
   * @param {string} encryptedData - Encrypted data
   * @returns {Object} - Decrypted data object
   */
  decrypt(encryptedData) {
    try {
      const decipher = crypto.createDecipheriv(this.algorithm, Buffer.from(this.secretKey).slice(0, 16), this.iv);
      const decrypted = Buffer.concat([decipher.update(Buffer.from(encryptedData, 'base64')), decipher.final()]);
      return JSON.parse(decrypted.toString());
    } catch (error) {
      console.error('Session decryption error:', error);
      // Try to parse as unencrypted JSON if decryption fails
      try {
        return JSON.parse(encryptedData);
      } catch {
        return {};
      }
    }
  }
}

/**
 * Custom session store with encryption support
 * Extends the default MemoryStore with encryption capabilities
 */
class EncryptedSessionStore {
  constructor(options = {}) {
    this.sessions = {};
    this.encryption = new SimpleEncryption(options.encryption);
  }

  /**
   * Get session data
   */
  get(sid, callback) {
    if (!this.sessions[sid]) {
      return callback(null, null);
    }
    
    try {
      const session = this.encryption.decrypt(this.sessions[sid]);
      callback(null, session);
    } catch (error) {
      callback(error);
    }
  }

  /**
   * Set session data
   */
  set(sid, session, callback) {
    try {
      this.sessions[sid] = this.encryption.encrypt(session);
      callback(null);
    } catch (error) {
      callback(error);
    }
  }

  /**
   * Destroy session
   */
  destroy(sid, callback) {
    delete this.sessions[sid];
    callback(null);
  }
}

/**
 * Creates a configured session middleware with encryption
 * @param {Object} options - Session configuration options
 * @returns {Function} - Configured session middleware
 */
const configureSessionMiddleware = (options = {}) => {
  // Default options
  const defaultOptions = {
    secret: process.env.SESSION_SECRET || 'recovery-register-default-key',
    resave: false,
    saveUninitialized: false,
    name: authConfig.identityOptions.session.cookieName || 'anonSession',
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  };

  // If client-side encryption is enabled, use our custom store
  if (authConfig.identityOptions.session.clientSideEncryption.enabled) {
    defaultOptions.store = new EncryptedSessionStore({
      encryption: {
        algorithm: authConfig.identityOptions.session.clientSideEncryption.algorithm,
        secretKey: defaultOptions.secret
      }
    });
  }

  // Merge with custom options
  const sessionOptions = { ...defaultOptions, ...options };
  
  return session(sessionOptions);
};

module.exports = configureSessionMiddleware; 