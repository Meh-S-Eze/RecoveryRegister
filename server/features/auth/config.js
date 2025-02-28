/**
 * Authentication configuration for the Recovery Register system
 * Implements privacy-focused, flexible authentication compatible with Celebrate Recovery principles
 */

module.exports = {
  identityOptions: {
    allowPseudonyms: true,
    requireEmail: false,
    minPseudonymLength: 2,
    credentialStrategy: 'optional',
    session: {
      cookieName: 'anonSession',
      clientSideEncryption: {
        enabled: true,
        algorithm: 'aes-128-cbc',
        keyRotation: 'future'
      }
    }
  },
  securityProfiles: {
    basic: {
      description: 'Basic protection for standard users',
      features: [
        'client_side_sanitization',
        'session_encryption_basic'
      ]
    },
    advanced: {
      description: 'Enhanced protection for sensitive data',
      features: [
        'client_side_sanitization',
        'session_encryption_aes256',
        'key_rotation',
        'server_side_storage'
      ]
    }
  },
  privacySettings: {
    sensitiveFields: ['email', 'realName', 'phone'],
    defaultPreference: 'pseudonym',
    autoAnonymous: true // Add auto-anonymous setting for users without email
  },
  // OAuth Configuration - Prepared but not implemented
  oauthProviders: {
    enabled: false, // Set to true when ready to enable
    google: {
      enabled: false, // Individual provider toggle
      // These would be set via environment variables when implemented
      configurationKeys: [
        'GOOGLE_CLIENT_ID',
        'GOOGLE_CLIENT_SECRET',
        'GOOGLE_CALLBACK_URL'
      ],
      scopes: ['profile', 'email'],
      autoCreateUser: true,
      autoLinkExisting: false,
      privacyOptions: {
        // Control which Google profile data to store/use
        storeProfileData: false,
        useGoogleEmail: true,
        useGoogleName: false
      }
    }
    // Additional providers can be added here
  }
}; 