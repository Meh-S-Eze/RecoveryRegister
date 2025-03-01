import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import RegistrationForm from "@/pages/RegistrationForm";
import Admin from "@/pages/Admin";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useEffect } from "react";

// AutoLogin component to handle automatic admin login
function AutoAdminLogin() {
  const [location, setLocation] = useLocation();
  
  useEffect(() => {
    // Only auto-login if we're on the admin page
    if (location === '/admin' && process.env.NODE_ENV !== 'production') {
      console.log('Auto admin login activated for /admin route');
      fetch('/api/auth/dev-admin-login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      })
      .then(response => {
        if (response.ok) {
          console.log('Auto admin login successful');
          return response.json();
        }
        throw new Error('Auto admin login failed');
      })
      .then(data => {
        // Store the session ID in localStorage for debugging
        if (data && data.sessionId) {
          localStorage.setItem('recoveryRegister_debug_sessionId', data.sessionId);
          console.log('Auto login saved session ID:', data.sessionId);
        }
      })
      .catch(error => {
        console.error('Auto admin login error:', error);
      });
    }
  }, [location]);
  
  return null; // This component doesn't render anything
}

function Router() {
  return (
    <>
      <AutoAdminLogin />
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/register" component={RegistrationForm} />
        <Route path="/admin" component={Admin} />
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1">
          <Router />
        </main>
        <Footer />
      </div>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
