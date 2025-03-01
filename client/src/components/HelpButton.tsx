import { useState } from "react";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { HelpCircle } from "lucide-react";

// Form validation schema
const issueReportSchema = z.object({
  description: z.string().min(1, "Please describe the issue you're experiencing"),
  contactInfo: z.string().optional(),
});

type IssueReportFormValues = z.infer<typeof issueReportSchema>;

export function HelpButton() {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  // Form setup with Zod validation
  const form = useForm<IssueReportFormValues>({
    resolver: zodResolver(issueReportSchema),
    defaultValues: {
      description: "",
      contactInfo: "",
    },
  });

  // Mutation for submitting the issue report
  const submitIssue = useMutation({
    mutationFn: async (values: IssueReportFormValues) => {
      const response = await apiRequest("POST", "/api/issue-reports", values);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Issue Reported",
        description: "Thank you for reporting this issue. We'll look into it as soon as possible.",
      });
      form.reset();
      setIsOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "There was an error submitting your issue report.",
        variant: "destructive",
      });
    },
  });

  // Form submission handler
  const onSubmit = (values: IssueReportFormValues) => {
    submitIssue.mutate(values);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="fixed top-4 right-4 text-primary hover:bg-primary/10 z-50"
        >
          <HelpCircle className="h-5 w-5 mr-1" />
          <span>Help</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Report an Issue</DialogTitle>
          <DialogDescription>
            Having trouble? Let us know what's not working so we can help.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>What's not working?</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Please describe what issue you're experiencing..."
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Please provide as much detail as possible about what's happening.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="contactInfo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Information (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Email or phone number to reach you"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    If you'd like us to follow up with you directly about this issue
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={submitIssue.isPending}
              >
                {submitIssue.isPending ? "Submitting..." : "Submit Issue"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}