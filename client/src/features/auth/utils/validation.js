/**
 * Authentication Form Validation Utilities
 * Provides consistent validation across authentication forms
 */

const authConfig = require('../../../../server/features/auth/config');

/**
 * Validates registration form data
 * @param {Object} data - Form data
 * @param {string} registrationType - 'pseudonym' or 'email'
 * @returns {Object} - Validation errors
 */
export const validateRegistrationForm = (data, registrationType) => {
  const errors = {};
  
  // Validate pseudonym for pseudonym-based registration
  if (registrationType === 'pseudonym' && !data.pseudonym) {
    errors.pseudonym = 'Pseudonym is required';
  } else if (
    registrationType === 'pseudonym' && 
    data.pseudonym && 
    data.pseudonym.length < authConfig?.identityOptions?.minPseudonymLength || 2
  ) {
    errors.pseudonym = `Pseudonym must be at least ${authConfig?.identityOptions?.minPseudonymLength || 2} characters`;
  }
  
  // Validate email for email-based registration
  if (registrationType === 'email' && !data.email) {
    errors.email = 'Email is required';
  } else if (registrationType === 'email' && data.email && !isValidEmail(data.email)) {
    errors.email = 'Please enter a valid email address';
  }
  
  // Password validation for all registration types
  if (!data.password) {
    errors.password = 'Password is required';
  } else if (data.password.length < 6) {
    errors.password = 'Password must be at least 6 characters';
  }
  
  // Password confirmation
  if (data.password !== data.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }
  
  return errors;
};

/**
 * Validates login form data
 * @param {Object} data - Form data
 * @returns {Object} - Validation errors
 */
export const validateLoginForm = (data) => {
  const errors = {};
  
  if (!data.identifier) {
    errors.identifier = 'Pseudonym or email is required';
  }
  
  if (!data.password) {
    errors.password = 'Password is required';
  }
  
  return errors;
};

/**
 * Validates password reset form data
 * @param {Object} data - Form data
 * @returns {Object} - Validation errors
 */
export const validatePasswordResetForm = (data) => {
  const errors = {};
  
  if (!data.newPassword) {
    errors.newPassword = 'New password is required';
  } else if (data.newPassword.length < 6) {
    errors.newPassword = 'New password must be at least 6 characters';
  }
  
  if (data.newPassword !== data.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }
  
  return errors;
};

/**
 * Validates an email address format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if email is valid
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validates identifier type
 * @param {string} identifier - User identifier
 * @returns {string} - 'email' or 'pseudonym'
 */
export const identifierType = (identifier) => {
  return isValidEmail(identifier) ? 'email' : 'pseudonym';
};

/**
 * Sanitizes form input
 * @param {string} input - User input
 * @returns {string} - Sanitized input
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return '';
  // Basic XSS protection for form inputs
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
};

export default {
  validateRegistrationForm,
  validateLoginForm,
  validatePasswordResetForm,
  isValidEmail,
  identifierType,
  sanitizeInput
}; 