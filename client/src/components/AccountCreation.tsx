import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

// Form schema for user account creation
const accountSchema = z.object({
  createAccount: z.boolean().default(false),
  username: z.string().min(3, "Username must be at least 3 characters").optional(),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
});

// Refine schema based on createAccount value
const conditionalAccountSchema = accountSchema.refine(
  (data) => {
    // If creating an account, username and password are required
    if (data.createAccount) {
      if (!data.username || !data.password) {
        return false; // Users need username and password
      }
    }
    return true;
  },
  {
    message: "Username and password are required",
    path: ["username"],
  }
);

type AccountValues = z.infer<typeof conditionalAccountSchema>;

interface AccountCreationProps {
  onAccountCreated: (userData: any) => void;
  onSkip: () => void;
  email?: string | null;
  name?: string | null;
  registrationId: number;
}

export function AccountCreation({ onAccountCreated, onSkip, email, name, registrationId }: AccountCreationProps) {
  const { toast } = useToast();
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);

  // Log the received values for debugging
  console.log("AccountCreation received values:", { email, name, registrationId });

  // Extract username from email if available
  const getInitialUsername = () => {
    // Ensure email is a non-empty string
    if (email && typeof email === 'string' && email.trim() !== '') {
      console.log("Using email as username:", email);
      // Use the entire email as username
      return email;
    } else if (name && typeof name === 'string' && name.trim() !== '') {
      console.log("Using name as username:", name);
      // Fall back to name if email is not available
      return name;
    }
    console.log("No valid email or name found, using empty string");
    return "";
  };

  // Calculate the username once on component initialization
  const initialUsername = getInitialUsername();
  console.log("Initial username set to:", initialUsername);

  const form = useForm<AccountValues>({
    resolver: zodResolver(conditionalAccountSchema),
    defaultValues: {
      createAccount: false,
      username: initialUsername,
      password: "",
    },
    mode: "onChange",
  });
  
  // Watch for changes to createAccount
  const createAccount = form.watch("createAccount");

  const registerUser = useMutation({
    mutationFn: (values: AccountValues) => {
      // Only proceed with account creation if user opted in
      if (!values.createAccount) {
        return Promise.resolve({ skipped: true });
      }

      const registerData = {
        username: values.username,
        // Ensure email is always a string, never null
        email: email || "",
        password: values.password,
        preferredContact: "username", // Default value
        registrationId: registrationId
      };

      console.log("Sending registration data:", registerData);
      
      return apiRequest("POST", "/api/auth/register", registerData)
        .then(res => res.json());
    },
    onSuccess: (data) => {
      if (data.skipped) {
        onSkip();
        return;
      }
      
      toast({
        title: "Account created",
        description: "Your account has been created successfully.",
      });
      
      onAccountCreated(data);
    },
    onError: (error: any) => {
      console.error("Account creation error:", error);
      toast({
        title: "Account creation failed",
        description: error.message || "There was a problem creating your account. Please try again.",
        variant: "destructive"
      });
    }
  });

  const onSubmit = (values: AccountValues) => {
    if (!values.createAccount) {
      onSkip();
      return;
    }
    
    console.log("Submitting form values:", values);
    registerUser.mutate(values);
  };

  return (
    <div className="mt-4 mb-6">
      <h3 className="text-lg font-semibold text-[#374151] mb-2">Create Account (Optional)</h3>
      <p className="mb-4 text-[#374151]">
        Creating an account is completely optional but allows you to receive updates and 
        access or modify your registration details later if needed.
      </p>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="createAccount"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-2 bg-gray-50 rounded-md">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(checked) => {
                      field.onChange(checked);
                      setIsCreatingAccount(!!checked);
                    }}
                    className="mt-1 h-5 w-5"
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="text-sm font-medium cursor-pointer">
                    Yes, I'd like to create an account
                  </FormLabel>
                  <FormDescription className="text-xs text-gray-500">
                    This lets you view or update your registration later
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          {createAccount && (
            <div className="rounded-md border p-4 space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Username</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Choose a username" 
                        className="min-h-[44px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      This will be your public identifier. You can use a nickname, made-up name, or any name you prefer - it doesn't have to be your real name.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Password</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="Create a password" 
                        className="min-h-[44px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Must be at least 6 characters
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Replaced contact method selection with informational text */}
              <div className="mb-4 p-3 bg-gray-50 rounded-md border border-gray-200">
                <h4 className="text-sm font-medium text-gray-800 mb-1">Account Information</h4>
                <p className="text-xs text-gray-600">
                  Creating an account allows you to sign in later to update your name, email, 
                  or other information. Your account details are kept private and secure.
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline"
              onClick={onSkip}
              className="min-h-[44px] text-blue-700 border-blue-300 hover:bg-blue-50"
            >
              {createAccount ? "Skip This Step" : "Continue Without Account"}
            </Button>
            {createAccount && (
              <Button 
                type="submit"
                disabled={registerUser.isPending}
                className="min-h-[44px]"
              >
                {registerUser.isPending ? "Creating Account..." : "Create Account"}
              </Button>
            )}
          </div>
        </form>
      </Form>
      
      <Accordion type="single" collapsible className="mt-6">
        <AccordionItem value="privacy">
          <AccordionTrigger className="text-sm font-medium">
            How is my information protected?
          </AccordionTrigger>
          <AccordionContent className="text-sm text-gray-600">
            <p>Your privacy is important to us. If you choose to remain anonymous, your personal identifiers won't be shared outside the secure database. Even if you create a username, all personal information is protected and only accessible to authorized administrators.</p>
            <p className="mt-2">We maintain strict confidentiality in accordance with Celebrate Recovery principles and our privacy policy.</p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}