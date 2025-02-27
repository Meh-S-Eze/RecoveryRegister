import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";

// Import authentication components
import { AuthProvider } from './features/auth/context/AuthContext';
import RegisterForm from './features/auth/components/RegisterForm';
import LoginForm from './features/auth/components/LoginForm';
import PrivacyIndicator, { PrivacyStatus } from './features/auth/components/PrivacyIndicator';
import ProtectedRoute, { AnonymousOnlyRoute } from './features/auth/components/ProtectedRoute';

// Import registration components
import { RegistrationPage, RegistrationCompletePage } from './features/registration';

// Example pages
const Home: React.FC = () => (
  <div className="page-container">
    <h1>Recovery Register</h1>
    <p>Welcome to the privacy-focused registration system for Celebrate Recovery.</p>
    <div className="auth-actions">
      <Link to="/login" className="btn btn-primary">Log In</Link>
      <Link to="/register" className="btn btn-secondary">Create Account</Link>
      <Link to="/registration" className="btn btn-accent">Register for Session</Link>
    </div>
  </div>
);

const Dashboard: React.FC = () => {
  return (
    <div className="page-container">
      <h1>Your Dashboard</h1>
      <PrivacyStatus />
      <p>This is a protected page that requires authentication.</p>
    </div>
  );
};

const ProfilePage: React.FC = () => {
  return (
    <div className="page-container">
      <h1>Your Profile</h1>
      <p>This page shows your profile information.</p>
      <PrivacyStatus />
    </div>
  );
};

const RegisterPage: React.FC = () => (
  <div className="page-container">
    <RegisterForm />
  </div>
);

const LoginPage: React.FC = () => (
  <div className="page-container">
    <LoginForm />
  </div>
);

interface LayoutProps {
  children: React.ReactNode;
}

/**
 * App Layout Component
 * Shows navigation and privacy indicator in header
 */
const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="logo">
          <Link to="/">Recovery Register</Link>
        </div>
        <nav className="main-nav">
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/dashboard">Dashboard</Link></li>
            <li><Link to="/profile">Profile</Link></li>
            <li><Link to="/registration">Registration</Link></li>
          </ul>
        </nav>
        <div className="auth-status">
          <PrivacyIndicator size="small" />
        </div>
      </header>
      
      <main className="app-content">
        {children}
      </main>
      
      <footer className="app-footer">
        <p>Recovery Register &copy; {new Date().getFullYear()}</p>
        <p>Privacy-Focused Authentication</p>
      </footer>
    </div>
  );
};

/**
 * Main App Component
 * Wraps everything with AuthProvider and sets up routes
 */
const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Layout>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Home />} />
              
              {/* Registration routes */}
              <Route path="/registration" element={<RegistrationPage />} />
              <Route path="/registration-complete" element={<RegistrationCompletePage />} />
              
              {/* Anonymous only routes (redirect if already logged in) */}
              <Route 
                path="/register" 
                element={
                  <AnonymousOnlyRoute>
                    <RegisterPage />
                  </AnonymousOnlyRoute>
                } 
              />
              
              <Route 
                path="/login" 
                element={
                  <AnonymousOnlyRoute>
                    <LoginPage />
                  </AnonymousOnlyRoute>
                } 
              />
              
              {/* Protected routes (require authentication) */}
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                } 
              />
              
              {/* Fallback route */}
              <Route path="*" element={<h1>Page Not Found</h1>} />
            </Routes>
          </Layout>
        </Router>
        <Toaster position="top-right" />
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
