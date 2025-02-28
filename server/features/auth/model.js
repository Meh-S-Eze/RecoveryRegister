/**
 * User model for the Recovery Register system
 * Implements privacy-focused data structure compatible with Celebrate Recovery principles
 */

const authConfig = require('./config');

class UserSchema {
  constructor() {
    this.fields = {
      id: { type: 'Number', primary: true, auto: true },
      username: { type: 'String' },
      email: { type: 'String', private: true },
      passwordHash: { type: 'String', select: false },
      identityType: { 
        type: 'String', 
        enum: ['pseudonym', 'email', 'oauth'],
        default: 'pseudonym'
      },
      // OAuth related fields - prepared for future integration
      oauthProviderId: { type: 'String', select: false },
      oauthProvider: { type: 'String' },
      oauthProfile: { type: 'Object', private: true, select: false },
      oauthTokens: { type: 'Object', private: true, select: false },
      // End of OAuth fields
      recoveryHash: { 
        type: 'String', 
        select: false  // Private, not returned in queries by default
      },
      securityProfile: {
        type: 'String',
        default: 'basic'
      },
      isAnonymous: { type: 'Boolean', default: false },
      preferredContact: { 
        type: 'String', 
        default: authConfig.privacySettings.defaultPreference
      },
      role: { type: 'String', default: 'user' },
      createdAt: { type: 'Date', default: 'now' }
    };
  }

  /**
   * Adds additional fields or properties to the schema
   * @param {Object} fields - Fields to add to the schema
   */
  add(fields) {
    this.fields = {
      ...this.fields,
      ...fields
    };
  }

  /**
   * Create a new user instance
   * @param {Object} data - User data
   */
  createUser(data) {
    // Auto-determine anonymity based on email presence
    if (data.email === undefined || data.email === null) {
      data.isAnonymous = true;
    }

    // Ensure only valid fields are used
    const validatedData = Object.keys(data).reduce((acc, key) => {
      if (this.fields[key]) {
        acc[key] = data[key];
      }
      return acc;
    }, {});

    // Apply defaults
    Object.keys(this.fields).forEach(key => {
      if (validatedData[key] === undefined && this.fields[key].default) {
        if (this.fields[key].default === 'now') {
          validatedData[key] = new Date();
        } else {
          validatedData[key] = this.fields[key].default;
        }
      }
    });

    return validatedData;
  }
}

// Create and export the schema
const UserModel = new UserSchema();

// Export both the schema and a function to create users
module.exports = {
  UserSchema: UserModel,
  createUser: (data) => UserModel.createUser(data)
}; 