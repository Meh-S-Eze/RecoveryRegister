/**
 * Authentication configuration for the Recovery Register system
 * Implements privacy-focused, flexible authentication compatible with Celebrate Recovery principles
 * 
 * @typedef {Object} PasswordOptions
 * @property {number} minLength - Minimum password length
 * @property {boolean} requireSpecialChar - Whether to require a special character
 * @property {boolean} requireNumber - Whether to require a number
 * @property {boolean} requireUppercase - Whether to require an uppercase letter
 * 
 * @typedef {Object} SessionEncryption
 * @property {boolean} enabled - Whether encryption is enabled
 * @property {string} algorithm - Encryption algorithm
 * 
 * @typedef {Object} SessionConfig
 * @property {string} cookieName - Name of the session cookie
 * @property {SessionEncryption} clientSideEncryption - Client-side encryption settings
 * 
 * @typedef {Object} IdentityOptions
 * @property {boolean} allowPseudonymousIdentity - Whether to allow pseudonymous identities
 * @property {SessionConfig} session - Session configuration
 * @property {PasswordOptions} password - Password configuration
 * 
 * @typedef {Object} PrivacyOptions
 * @property {string} defaultContactPreference - Default contact preference
 * @property {boolean} allowContactOptOut - Whether to allow contact opt-out
 * @property {boolean} enforceDataMinimization - Whether to enforce data minimization
 * 
 * @typedef {Object} AuthConfig
 * @property {IdentityOptions} identityOptions - Identity management options
 * @property {PrivacyOptions} privacyOptions - Privacy settings
 */

/** @type {AuthConfig} */
const authConfig = {
  // Core identity management options
  identityOptions: {
    // Pseudonymous mode allows users to register without email
    allowPseudonymousIdentity: true,
    
    // Session configuration
    session: {
      cookieName: 'recovery_session',
      clientSideEncryption: {
        enabled: false, // Disabled for simplicity
        algorithm: 'aes-256-cbc' // Standard AES encryption
      }
    },
    
    // Password options
    password: {
      minLength: 8,
      requireSpecialChar: false,
      requireNumber: false,
      requireUppercase: false
    }
  },
  
  // Privacy settings
  privacyOptions: {
    // Default contact preference if not specified by user
    defaultContactPreference: 'none',
    
    // Allow users to opt out of all communications
    allowContactOptOut: true,
    
    // Data minimization - only collect what's necessary
    enforceDataMinimization: true
  }
};

export default authConfig;