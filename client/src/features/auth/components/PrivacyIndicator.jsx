import React from 'react';
import { useAuth } from '../context/AuthContext';

/**
 * Privacy Indicator Component
 * Visual indication of current privacy/anonymity status
 * Updates automatically based on user state
 */
const PrivacyIndicator = ({ size = 'medium', showLabel = true }) => {
  // Get auth context
  const { user, isAnonymous, isAuthenticated, getIdentityType } = useAuth();
  
  // Not authenticated
  if (!isAuthenticated()) {
    return (
      <div className={`privacy-indicator not-authenticated ${size}`}>
        <div className="indicator-icon">👋</div>
        {showLabel && <span className="indicator-label">Not Signed In</span>}
      </div>
    );
  }
  
  // Anonymous user
  if (isAnonymous()) {
    return (
      <div className={`privacy-indicator anonymous ${size}`}>
        <div className="indicator-icon">🔒</div>
        {showLabel && <span className="indicator-label">Anonymous</span>}
        <div className="indicator-tooltip">
          <div className="tooltip-content">
            <p><strong>Anonymous Mode</strong></p>
            <p>Your identity is protected. Other users cannot see your personal information.</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Identified user
  return (
    <div className={`privacy-indicator identified ${size}`}>
      <div className="indicator-icon">👤</div>
      {showLabel && <span className="indicator-label">Identified</span>}
      <div className="indicator-tooltip">
        <div className="tooltip-content">
          <p><strong>Identified Mode</strong></p>
          <p>The system knows your identity, but your personal information remains private from other users.</p>
        </div>
      </div>
    </div>
  );
};

/**
 * Extended Privacy Status Component
 * Provides more detailed privacy information and controls
 */
export const PrivacyStatus = () => {
  // Get auth context
  const { user, isAnonymous, getIdentityType } = useAuth();
  
  if (!user) {
    return null;
  }
  
  const identityType = getIdentityType();
  
  return (
    <div className="privacy-status-container">
      <div className="privacy-status-header">
        <PrivacyIndicator size="large" showLabel={true} />
      </div>
      
      <div className="privacy-status-details">
        <div className="status-item">
          <span className="status-label">Identity Type:</span>
          <span className="status-value">{identityType === 'pseudonym' ? 'Pseudonym' : 'Email'}</span>
        </div>
        
        <div className="status-item">
          <span className="status-label">Anonymity Status:</span>
          <span className="status-value">{isAnonymous() ? 'Anonymous' : 'Identifiable'}</span>
        </div>
        
        <div className="status-item">
          <span className="status-label">Username:</span>
          <span className="status-value">{user.username}</span>
        </div>
      </div>
      
      <div className="privacy-explanation">
        {isAnonymous() ? (
          <p>
            You are using the system anonymously with a pseudonym. 
            Your true identity is not stored in the system.
          </p>
        ) : (
          <p>
            You are using the system with an email identity.
            Your email is kept private and never shown to other users.
          </p>
        )}
      </div>
    </div>
  );
};

export default PrivacyIndicator; 