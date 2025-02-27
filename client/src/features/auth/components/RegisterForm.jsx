import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

/**
 * Registration Form Component
 * Implements a privacy-focused registration form with automatic anonymity
 * No explicit anonymous checkbox - determined automatically from inputs
 */
const RegisterForm = () => {
  // Form state
  const [formData, setFormData] = useState({
    pseudonym: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  const [formErrors, setFormErrors] = useState({});
  const [registrationType, setRegistrationType] = useState('pseudonym'); // 'pseudonym' or 'email'
  
  // Get auth context
  const { register, loading, error } = useAuth();
  
  // Calculate if the user will be anonymous based on email presence
  const willBeAnonymous = !formData.email || registrationType === 'pseudonym';
  
  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear validation error when user types
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: ''
      });
    }
  };
  
  // Toggle between pseudonym and email registration
  const toggleRegistrationType = () => {
    setRegistrationType(registrationType === 'pseudonym' ? 'email' : 'pseudonym');
    // Clear any validation errors when switching
    setFormErrors({});
  };
  
  // Validate form before submission
  const validateForm = () => {
    const errors = {};
    
    if (registrationType === 'pseudonym' && !formData.pseudonym) {
      errors.pseudonym = 'Pseudonym is required';
    }
    
    if (registrationType === 'email' && !formData.email) {
      errors.email = 'Email is required';
    }
    
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
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
      // Prepare registration data based on type
      const registrationData = {
        password: formData.password
      };
      
      if (registrationType === 'pseudonym') {
        registrationData.pseudonym = formData.pseudonym;
      } else {
        registrationData.email = formData.email;
      }
      
      // Register user
      await register(registrationData);
      
      // Reset form on success
      setFormData({
        pseudonym: '',
        email: '',
        password: '',
        confirmPassword: ''
      });
      setFormErrors({});
      
    } catch (err) {
      // Error is handled by the auth context
      console.error('Registration error:', err);
    }
  };
  
  return (
    <div className="auth-form-container">
      <h2>Create an Account</h2>
      
      <div className="identity-toggle">
        <button 
          type="button"
          className={`toggle-btn ${registrationType === 'pseudonym' ? 'active' : ''}`}
          onClick={() => setRegistrationType('pseudonym')}
        >
          Use Pseudonym
        </button>
        <button 
          type="button"
          className={`toggle-btn ${registrationType === 'email' ? 'active' : ''}`}
          onClick={() => setRegistrationType('email')}
        >
          Use Email
        </button>
      </div>
      
      {/* Privacy indicator - automatically shows based on input */}
      <div className={`privacy-indicator ${willBeAnonymous ? 'anonymous' : 'identified'}`}>
        <div className="indicator-icon">
          {willBeAnonymous ? '🔒' : '👤'}
        </div>
        <div className="indicator-text">
          {willBeAnonymous 
            ? 'You will be anonymous to other users' 
            : 'Your email will be private but you will not be anonymous to system'}
        </div>
      </div>
      
      <form onSubmit={handleSubmit}>
        {/* Show pseudonym field for pseudonym registration */}
        {registrationType === 'pseudonym' && (
          <div className="form-group">
            <label htmlFor="pseudonym">Pseudonym:</label>
            <input
              type="text"
              id="pseudonym"
              name="pseudonym"
              value={formData.pseudonym}
              onChange={handleChange}
              placeholder="Enter a pseudonym to remain anonymous"
              className={formErrors.pseudonym ? 'error' : ''}
            />
            {formErrors.pseudonym && <div className="error-message">{formErrors.pseudonym}</div>}
            <div className="field-description">
              A pseudonym allows you to participate without using your real identity
            </div>
          </div>
        )}
        
        {/* Show email field for email registration */}
        {registrationType === 'email' && (
          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email address"
              className={formErrors.email ? 'error' : ''}
            />
            {formErrors.email && <div className="error-message">{formErrors.email}</div>}
            <div className="field-description">
              Your email will never be shown to other users
            </div>
          </div>
        )}
        
        {/* Password fields shown for both registration types */}
        <div className="form-group">
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Create a password"
            className={formErrors.password ? 'error' : ''}
          />
          {formErrors.password && <div className="error-message">{formErrors.password}</div>}
        </div>
        
        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm Password:</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Confirm your password"
            className={formErrors.confirmPassword ? 'error' : ''}
          />
          {formErrors.confirmPassword && <div className="error-message">{formErrors.confirmPassword}</div>}
        </div>
        
        {/* Show any API error from the auth context */}
        {error && <div className="api-error-message">{error}</div>}
        
        <button 
          type="submit" 
          className="submit-btn" 
          disabled={loading}
        >
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>
      
      <div className="form-footer">
        <p>
          Already have an account? <a href="/login">Log in</a>
        </p>
      </div>
    </div>
  );
};

export default RegisterForm; 