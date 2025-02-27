import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

/**
 * Login Form Component
 * Implements a unified login that accepts either pseudonym or email
 * Uses privacy-preserving error messages
 */
const LoginForm = () => {
  // Form state
  const [formData, setFormData] = useState({
    identifier: '',
    password: ''
  });
  
  const [formErrors, setFormErrors] = useState({});
  const [lastIdentifierType, setLastIdentifierType] = useState(
    localStorage.getItem('lastIdentifierType') || 'pseudonym'
  );
  
  // Get auth context
  const { login, loading, error } = useAuth();
  
  // Determine if the identifier is an email
  const isEmail = formData.identifier && formData.identifier.includes('@');
  
  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Detect identifier type and store for future use
    if (name === 'identifier') {
      const type = value.includes('@') ? 'email' : 'pseudonym';
      setLastIdentifierType(type);
    }
    
    // Clear validation error when user types
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: ''
      });
    }
  };
  
  // Validate form before submission
  const validateForm = () => {
    const errors = {};
    
    if (!formData.identifier) {
      errors.identifier = 'Pseudonym or email is required';
    }
    
    if (!formData.password) {
      errors.password = 'Password is required';
    }
    
    return errors;
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setFormErrors(validationErrors);
      return;
    }
    
    try {
      // Store the last used identifier type in localStorage
      localStorage.setItem('lastIdentifierType', isEmail ? 'email' : 'pseudonym');
      
      // Login
      await login(formData);
      
      // Reset form on success (though should navigate away)
      setFormData({
        identifier: '',
        password: ''
      });
      setFormErrors({});
      
    } catch (err) {
      // Error is handled by the auth context
      console.error('Login error:', err);
    }
  };
  
  return (
    <div className="auth-form-container">
      <h2>Log In</h2>
      
      <div className="identity-type-indicator">
        <span className="indicator-text">
          {isEmail ? 'Using Email' : 'Using Pseudonym'}
        </span>
        <div className="indicator-icon">
          {isEmail ? '📧' : '🔒'}
        </div>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="identifier">Pseudonym or Email:</label>
          <input
            type="text"
            id="identifier"
            name="identifier"
            value={formData.identifier}
            onChange={handleChange}
            placeholder="Enter your pseudonym or email"
            className={formErrors.identifier ? 'error' : ''}
          />
          {formErrors.identifier && <div className="error-message">{formErrors.identifier}</div>}
          <div className="field-description">
            You can log in with either your pseudonym or email
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter your password"
            className={formErrors.password ? 'error' : ''}
          />
          {formErrors.password && <div className="error-message">{formErrors.password}</div>}
        </div>
        
        {/* Show any API error from the auth context */}
        {error && <div className="api-error-message">
          {/* Privacy-preserving error message - doesn't reveal if account exists */}
          {error === 'Invalid credentials' 
            ? 'The identifier or password you entered is incorrect' 
            : error}
        </div>}
        
        <button 
          type="submit" 
          className="submit-btn" 
          disabled={loading}
        >
          {loading ? 'Logging In...' : 'Log In'}
        </button>
      </form>
      
      <div className="form-footer">
        <p>
          Don't have an account? <a href="/register">Register</a>
        </p>
        <p className="forgot-password">
          <a href="/forgot-password">Forgot password?</a>
        </p>
      </div>
    </div>
  );
};

export default LoginForm; 