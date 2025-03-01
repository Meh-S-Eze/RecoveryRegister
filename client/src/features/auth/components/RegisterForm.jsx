import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { TextField, FormControl, InputLabel, Select, MenuItem } from '@mui/material';

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
  const [identityType, setIdentityType] = useState('pseudonym'); // 'pseudonym' or 'email'
  
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
    <div className="registration-notice">
      <h2>Account Creation Currently Limited</h2>
      <p>
        Please contact your Celebrate Recovery Leader to request access. 
        Admin-approved accounts only at this time.
      </p>
      <form onSubmit={handleSubmit}>
        <FormControl fullWidth>
          <InputLabel>Identity Type</InputLabel>
          <Select
            value={identityType}
            onChange={(e) => setIdentityType(e.target.value)}
          >
            <MenuItem value="pseudonym">Pseudonym (Anonymous)</MenuItem>
            <MenuItem value="email">Email (Non-anonymous)</MenuItem>
          </Select>
        </FormControl>

        {identityType === 'pseudonym' && (
          <TextField
            label="Pseudonym"
            name="pseudonym"
            helperText="Minimum 2 characters"
            required
          />
        )}

        {identityType === 'email' && (
          <TextField
            label="Email"
            name="email"
            type="email"
            required
          />
        )}
      </form>
    </div>
  );
};

export default RegisterForm; 