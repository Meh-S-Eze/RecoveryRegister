import { useState } from "react";
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

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const login = useMutation({
    mutationFn: (credentials: LoginFormValues) => {
      // Convert from username/password to identifier/password
      return apiRequest("POST", "/api/auth/login", {
        identifier: credentials.username,
        password: credentials.password
      });
    },
    onSuccess: () => {
      toast({
        title: "Login successful",
        description: "You are now logged in as an administrator.",
      });
      onLoginSuccess();
    },
    onError: (error: any) => {
      setAuthError("Invalid username or password. Please try again.");
      toast({
        title: "Login failed",
        description: error.message || "There was an error logging in. Please try again.",
        variant: "destructive",
      });
    },
  });

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
                  <FormLabel>Username</FormLabel>
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
                  <FormLabel>Password</FormLabel>
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