/**
 * Client Sanitization Utility
 * Prevents sensitive data exposure to clients in accordance with privacy principles
 */

const authConfig = require('../config');

/**
 * Sanitizes user data before sending to the client
 * @param {Object} data - User or sensitive data object
 * @param {Array} additionalSensitiveKeys - Any additional keys to treat as sensitive
 * @returns {Object} - Sanitized data object
 */
const sanitizeClientData = (data, additionalSensitiveKeys = []) => {
  if (!data) return null;
  
  // Combine default sensitive keys with any additional ones
  const sensitiveKeys = [
    ...authConfig.privacySettings.sensitiveFields,
    ...additionalSensitiveKeys
  ];
  
  // Create a new object with only non-sensitive data
  return Object.keys(data).reduce((sanitized, key) => {
    if (!sensitiveKeys.includes(key)) {
      sanitized[key] = data[key];
    }
    return sanitized;
  }, {});
};

/**
 * Sanitizes an array of data objects
 * @param {Array} dataArray - Array of data objects to sanitize
 * @param {Array} additionalSensitiveKeys - Any additional keys to treat as sensitive
 * @returns {Array} - Array of sanitized data objects
 */
const sanitizeClientDataArray = (dataArray, additionalSensitiveKeys = []) => {
  if (!Array.isArray(dataArray)) return [];
  
  return dataArray.map(item => sanitizeClientData(item, additionalSensitiveKeys));
};

/**
 * Replaces sensitive data with masked versions
 * @param {Object} data - Data object
 * @param {Object} fieldMasks - Object mapping field names to masking functions
 * @returns {Object} - Data with sensitive fields masked
 */
const maskSensitiveData = (data, fieldMasks = {}) => {
  if (!data) return null;
  
  const defaultMasks = {
    email: (email) => email ? `${email.substring(0, 2)}****@${email.split('@')[1]}` : null,
    phone: (phone) => phone ? `***-***-${phone.slice(-4)}` : null,
    realName: (name) => name ? `${name.charAt(0)}. ${name.split(' ').pop().charAt(0)}.` : null
  };
  
  const masks = { ...defaultMasks, ...fieldMasks };
  const result = { ...data };
  
  // Apply masks to sensitive fields if they exist in the data
  Object.keys(masks).forEach(field => {
    if (data[field]) {
      result[field] = masks[field](data[field]);
    }
  });
  
  return result;
};

module.exports = {
  sanitizeClientData,
  sanitizeClientDataArray,
  maskSensitiveData
}; 