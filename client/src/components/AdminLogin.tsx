import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { AlertCircle } from "lucide-react";

// Client-side logger for debugging purposes
const clientLogger = {
  info: (message: string, data?: any) => {
    console.log(`[ADMIN LOGIN] ${new Date().toISOString()} - ${message}`, data);
  },
  error: (message: string, data?: any) => {
    console.error(`[ADMIN LOGIN ERROR] ${new Date().toISOString()} - ${message}`, data);
  }
};

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

interface AdminLoginProps {
  onLoginSuccess: () => void;
}

export function AdminLogin({ onLoginSuccess }: AdminLoginProps) {
  const { toast } = useToast();
  const [authError, setAuthError] = useState<string | null>(null);
  const [showDevLogin, setShowDevLogin] = useState(false);

  // Check if we're in development mode for showing the dev login button
  useEffect(() => {
    const isDevelopment = process.env.NODE_ENV !== 'production';
    setShowDevLogin(isDevelopment);
    clientLogger.info("Admin login component mounted in environment", { isDevelopment });
    
    // Clear any stale session data on mount
    localStorage.removeItem('recoveryRegister_debug_sessionId');
  }, []);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const login = useMutation({
    mutationFn: async (credentials: LoginFormValues) => {
      clientLogger.info("Attempting login with credentials", { username: credentials.username });
      // Convert from username/password to identifier/password
      const response = await apiRequest("POST", "/api/auth/login", {
        identifier: credentials.username,
        password: credentials.password
      });
      // Return the response data
      return await response.json();
    },
    onSuccess: (data) => {
      clientLogger.info("Login successful, user data:", data);
      toast({
        title: "Login successful",
        description: "You are now logged in as an administrator.",
      });
      
      // Small delay to ensure session is properly set before checking auth status
      setTimeout(() => {
        onLoginSuccess();
      }, 1000); // Increased to 1000ms to ensure cookies are set
    },
    onError: (error: any) => {
      clientLogger.error("Login error", { error });
      setAuthError("Invalid username or password. Please try again.");
      toast({
        title: "Login failed",
        description: error.message || "There was an error logging in. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDevLogin = async () => {
    try {
      clientLogger.info("Attempting dev bypass login");
      const response = await fetch('/api/auth/dev-admin-login', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        clientLogger.info("Dev login response", data);
        
        // If a sessionId was included in the response, save it for debugging
        if (data && data.sessionId) {
          clientLogger.info("Dev login successful, session ID:", data.sessionId);
          localStorage.setItem('recoveryRegister_debug_sessionId', data.sessionId);
        }
        
        toast({
          title: "Developer Login",
          description: "You are now logged in as an administrator.",
        });
        
        // Use a longer delay to ensure the session is properly established
        setTimeout(onLoginSuccess, 1000);
      } else {
        const errorText = await response.text();
        throw new Error(`Dev login failed: ${errorText}`);
      }
    } catch (error) {
      clientLogger.error("Dev login error", { error });
      toast({
        title: "Dev Bypass Failed",
        description: "Could not complete developer login",
        variant: "destructive"
      });
    }
  };

  const onSubmit = (values: LoginFormValues) => {
    setAuthError(null);
    login.mutate(values);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Admin Login</CardTitle>
        <CardDescription>
          Enter your credentials to access the admin dashboard
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {authError && (
              <div className="flex items-center p-3 text-sm bg-red-50 border border-red-200 rounded-md text-red-800">
                <AlertCircle className="h-4 w-4 mr-2" />
                <span>{authError}</span>
              </div>
            )}
            
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Username</FormLabel>
                    <div className="group relative">
                      <AlertCircle className="h-4 w-4 text-slate-400" />
                      <Button 
                        type="button"
                        variant="ghost" 
                        size="sm" 
                        className="absolute -top-1 -right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 h-6 w-6"
                        onClick={() => form.setValue('username', 'test')}
                      >
                        <span className="sr-only">Auto-fill test user</span>
                        <span className="text-xs">Use test</span>
                      </Button>
                    </div>
                  </div>
                  <FormControl>
                    <Input placeholder="Enter your username" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Password</FormLabel>
                    <div className="group relative">
                      <AlertCircle className="h-4 w-4 text-slate-400" />
                      <Button 
                        type="button"
                        variant="ghost" 
                        size="sm" 
                        className="absolute -top-1 -right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 h-6 w-6"
                        onClick={() => form.setValue('password', 'testtest1')}
                      >
                        <span className="sr-only">Auto-fill test password</span>
                        <span className="text-xs">Use test</span>
                      </Button>
                    </div>
                  </div>
                  <FormControl>
                    <Input type="password" placeholder="Enter your password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={login.isPending}
            >
              {login.isPending ? (
                <span className="flex items-center justify-center">
                  <span className="animate-spin h-4 w-4 mr-2 border-2 border-b-transparent rounded-full"></span>
                  Logging in...
                </span>
              ) : "Login"}
            </Button>
            
            {showDevLogin && (
              <div className="mt-6 border-t pt-4">
                <Button
                  variant="outline"
                  className="w-full text-yellow-600 border-yellow-300 hover:bg-yellow-50"
                  onClick={handleDevLogin}
                  type="button"
                >
                  🚀 Development Bypass
                </Button>
                <p className="text-xs text-yellow-600 mt-2 text-center">
                  Warning: Development-only access. Disable in production!
                </p>
              </div>
            )}
            
            <div className="text-center text-sm text-gray-500 mt-4">
              <p>Need admin access? Contact a super administrator to request access.</p>
              <p>Super Admin Contact: (615) 499-8379</p>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}