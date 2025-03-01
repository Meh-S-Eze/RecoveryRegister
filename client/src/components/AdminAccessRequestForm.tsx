import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter 
} from "@/components/ui/card";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage,
  FormDescription
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { AlertCircle, HelpCircle } from "lucide-react";

const accessRequestSchema = z.object({
  name: z.string().min(1, "Your name is required"),
  email: z.string().email("Please enter a valid email address"),
  contactNumber: z.string().min(10, "Please enter a valid contact number"),
  reason: z.string().min(10, "Please briefly explain why you need access"),
  groupType: z.string().optional(),
});

type AccessRequestFormValues = z.infer<typeof accessRequestSchema>;

export function AdminAccessRequestForm({ onClose }: { onClose: () => void }) {
  const { toast } = useToast();
  const [requestStatus, setRequestStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const form = useForm<AccessRequestFormValues>({
    resolver: zodResolver(accessRequestSchema),
    defaultValues: {
      name: "",
      email: "",
      contactNumber: "",
      reason: "",
      groupType: "",
    },
  });

  const submitRequest = useMutation({
    mutationFn: async (values: AccessRequestFormValues) => {
      const response = await apiRequest("POST", "/api/admin-access-request", values);
      return await response.json();
    },
    onSuccess: () => {
      setRequestStatus('success');
      toast({
        title: "Request Submitted",
        description: "Your admin access request has been submitted. You will be contacted shortly.",
      });
      // Clear form after submission
      form.reset();
    },
    onError: (error: any) => {
      setRequestStatus('error');
      toast({
        title: "Submission Failed",
        description: error.message || "There was an error submitting your request. Please try again or contact support directly.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: AccessRequestFormValues) => {
    submitRequest.mutate(values);
  };

  if (requestStatus === 'success') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-green-600">Request Submitted</CardTitle>
          <CardDescription>
            Your request for admin access has been submitted successfully.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-green-50 border border-green-200 rounded-md p-4 text-green-800">
            <p className="mb-2">Thank you for your request. A super administrator will review your request and contact you shortly.</p>
            <p>In the meantime, you can continue using the registration system as a regular user.</p>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={onClose} 
            className="w-full"
          >
            Return to Login
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Request Admin Access</CardTitle>
        <CardDescription>
          Submit your information to request administrator access
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="Enter your email address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="contactNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Number</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="Enter your phone number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="groupType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Group Type (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Men's, Women's, or specific group name" {...field} />
                  </FormControl>
                  <FormDescription>
                    If you're a group leader, specify which group you lead
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason for Access</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Briefly explain why you need administrator access" 
                      className="min-h-[80px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 text-blue-800 text-sm">
              <div className="flex items-start">
                <HelpCircle className="h-5 w-5 mt-0.5 mr-2 flex-shrink-0" />
                <div>
                  <p className="font-medium">Admin Access Information</p>
                  <p className="mt-1">
                    Administrator access is typically granted to group leaders, administrators, and 
                    ministry staff members. Your request will be reviewed by a super administrator, 
                    and you will be contacted within 1-2 business days.
                  </p>
                  <p className="mt-1">
                    For urgent access requests, please contact the super administrator directly at (615) 499-8379.
                  </p>
                </div>
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={submitRequest.isPending}
            >
              {submitRequest.isPending ? (
                <span className="flex items-center justify-center">
                  <span className="animate-spin h-4 w-4 mr-2 border-2 border-b-transparent rounded-full"></span>
                  Submitting...
                </span>
              ) : "Submit Request"}
            </Button>
            
            <Button 
              type="button"
              variant="outline"
              className="w-full mt-2" 
              onClick={onClose}
            >
              Cancel
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}