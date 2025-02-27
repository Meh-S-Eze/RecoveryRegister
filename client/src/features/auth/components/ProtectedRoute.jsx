import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Protected Route Component
 * Redirects to login if user is not authenticated
 * Can also require specific anonymity status or roles
 */
const ProtectedRoute = ({ 
  children, 
  requireAuth = true,
  requireAnonymous = false,
  requiredRoles = [],
  redirectPath = '/login'
}) => {
  const { isAuthenticated, isAnonymous, user, loading } = useAuth();
  const location = useLocation();
  
  // Show loading indicator while auth state is being checked
  if (loading) {
    return (
      <div className="auth-loading">
        <div className="loading-spinner"></div>
        <p>Checking authentication...</p>
      </div>
    );
  }
  
  // For routes that require authentication
  if (requireAuth && !isAuthenticated()) {
    // Store the attempted URL to redirect back after login
    const returnUrl = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`${redirectPath}?returnUrl=${returnUrl}`} replace />;
  }
  
  // For routes that require anonymous status
  if (requireAnonymous && !isAnonymous()) {
    return <Navigate to="/" replace />;
  }
  
  // For routes that require specific roles
  if (requiredRoles.length > 0 && (!user || !user.role || !requiredRoles.includes(user.role))) {
    return <Navigate to="/" replace />;
  }
  
  // Render children if all checks pass
  return children;
};

/**
 * Anonymous Only Route
 * Redirects to home if user is already authenticated
 * Useful for login/registration pages
 */
export const AnonymousOnlyRoute = ({ children, redirectPath = '/' }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="auth-loading">
        <div className="loading-spinner"></div>
        <p>Checking authentication...</p>
      </div>
    );
  }
  
  if (isAuthenticated()) {
    return <Navigate to={redirectPath} replace />;
  }
  
  return children;
};

/**
 * Role Restricted Route
 * Only allows access to users with specific roles
 */
export const RoleRestrictedRoute = ({ children, allowedRoles = [], redirectPath = '/' }) => {
  const { user, isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="auth-loading">
        <div className="loading-spinner"></div>
        <p>Checking authorization...</p>
      </div>
    );
  }
  
  if (!isAuthenticated() || !user.role || !allowedRoles.includes(user.role)) {
    return <Navigate to={redirectPath} replace />;
  }
  
  return children;
};

export default ProtectedRoute; 