import React from 'react';

/**
 * FormInput - Reusable form input component with validation and hints
 */
export const FormInput = ({
  id,
  name,
  type = 'text',
  label,
  value,
  onChange,
  placeholder,
  error,
  description,
  required = false,
  autoComplete,
  className = ''
}) => {
  return (
    <div className={`form-group ${error ? 'has-error' : ''} ${className}`}>
      {label && (
        <label htmlFor={id}>
          {label}
          {required && <span className="required-indicator">*</span>}
        </label>
      )}
      
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={error ? 'error' : ''}
        autoComplete={autoComplete}
        required={required}
      />
      
      {error && <div className="error-message">{error}</div>}
      
      {description && !error && (
        <div className="field-description">{description}</div>
      )}
    </div>
  );
};

/**
 * FormButton - Consistent button styling for forms
 */
export const FormButton = ({
  type = 'button',
  onClick,
  disabled = false,
  isLoading = false,
  loadingText = 'Processing...',
  children,
  className = '',
  variant = 'primary'
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`btn btn-${variant} ${className} ${isLoading ? 'loading' : ''}`}
    >
      {isLoading ? (
        <>
          <span className="loading-spinner small"></span>
          <span>{loadingText}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
};

/**
 * FormFeedback - Messaging for form success/error states
 */
export const FormFeedback = ({ 
  type = 'info', // 'info', 'success', 'error', 'warning'
  message,
  onDismiss,
  dismissable = true
}) => {
  if (!message) return null;
  
  return (
    <div className={`form-feedback ${type}`}>
      <div className="feedback-icon">
        {type === 'success' && '✓'}
        {type === 'error' && '!'}
        {type === 'warning' && '⚠'}
        {type === 'info' && 'ℹ'}
      </div>
      <div className="feedback-message">{message}</div>
      {dismissable && onDismiss && (
        <button 
          type="button" 
          className="dismiss-button"
          onClick={onDismiss}
          aria-label="Dismiss message"
        >
          ×
        </button>
      )}
    </div>
  );
};

/**
 * AuthFormContainer - Wrapper for authentication forms
 */
export const AuthFormContainer = ({ 
  title, 
  subtitle, 
  children, 
  footer 
}) => {
  return (
    <div className="auth-form-container">
      {title && <h2 className="auth-form-title">{title}</h2>}
      {subtitle && <p className="auth-form-subtitle">{subtitle}</p>}
      
      <div className="auth-form-content">
        {children}
      </div>
      
      {footer && (
        <div className="auth-form-footer">
          {footer}
        </div>
      )}
    </div>
  );
};

/**
 * IdentityToggle - Toggle between pseudonym and email login/registration
 */
export const IdentityToggle = ({ 
  activeType,
  onChange
}) => {
  return (
    <div className="identity-toggle">
      <button 
        type="button"
        className={`toggle-btn ${activeType === 'pseudonym' ? 'active' : ''}`}
        onClick={() => onChange('pseudonym')}
      >
        Use Pseudonym
      </button>
      <button 
        type="button"
        className={`toggle-btn ${activeType === 'email' ? 'active' : ''}`}
        onClick={() => onChange('email')}
      >
        Use Email
      </button>
    </div>
  );
};

/**
 * PrivacyBadge - Visual indicator of privacy status in forms
 */
export const PrivacyBadge = ({ isAnonymous }) => {
  return (
    <div className={`privacy-badge ${isAnonymous ? 'anonymous' : 'identified'}`}>
      <div className="badge-icon">
        {isAnonymous ? '🔒' : '👤'}
      </div>
      <div className="badge-text">
        {isAnonymous 
          ? 'Anonymous Mode' 
          : 'Identified Mode'}
      </div>
    </div>
  );
};

/**
 * LoadingOverlay - Loading indicator for async operations
 */
export const LoadingOverlay = ({ 
  isLoading, 
  message = 'Loading...',
  transparent = false
}) => {
  if (!isLoading) return null;
  
  return (
    <div className={`loading-overlay ${transparent ? 'transparent' : ''}`}>
      <div className="loading-content">
        <div className="loading-spinner"></div>
        <p className="loading-message">{message}</p>
      </div>
    </div>
  );
}; 