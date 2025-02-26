import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PrivacyNotice } from "@/components/PrivacyNotice";
import { FormProgress } from "@/components/FormProgress";
import { ConfirmationMessage } from "@/components/ConfirmationMessage";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Form schema
const formSchema = z.object({
  // Step 1
  privacyConsent: z.boolean().refine(val => val === true, {
    message: "You must acknowledge the privacy notice to continue."
  }),
  
  // Step 2
  name: z.string().optional(),
  email: z.string().email("Please enter a valid email address").optional().or(z.literal("")),
  phone: z.string().optional(),
  contactConsent: z.boolean().default(false),
  
  // Step 3
  groupType: z.string().min(1, "Please select a group type"),
  availableDays: z.array(z.string()).min(1, "Please select at least one day"),
  availableTimes: z.array(z.string()).min(1, "Please select at least one time"),
  additionalNotes: z.string().optional()
});

type FormValues = z.infer<typeof formSchema>;

export function RegistrationSteps() {
  const [step, setStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      privacyConsent: false,
      name: "",
      email: "",
      phone: "",
      contactConsent: false,
      groupType: "",
      availableDays: [],
      availableTimes: [],
      additionalNotes: ""
    },
    mode: "onChange"
  });
  
  const registration = useMutation({
    mutationFn: (values: FormValues) => {
      return apiRequest("POST", "/api/registrations", values)
        .then(res => res.json());
    },
    onSuccess: () => {
      setIsSubmitted(true);
    },
    onError: (error) => {
      toast({
        title: "Registration failed",
        description: error.message || "There was a problem with your registration. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  const totalSteps = 3;
  
  const nextStep = async (stepNum: number) => {
    if (stepNum === 1) {
      const isValid = await form.trigger("privacyConsent");
      if (!isValid) return;
    }
    
    if (stepNum === 2) {
      const isValid = await form.trigger(["name", "email", "phone", "contactConsent"]);
      if (!isValid) return;
    }
    
    setStep(step + 1);
  };
  
  const prevStep = () => {
    setStep(step - 1);
  };
  
  const onSubmit = async (values: FormValues) => {
    registration.mutate(values);
  };
  
  if (isSubmitted) {
    return <ConfirmationMessage />;
  }
  
  return (
    <Card className="bg-white rounded-lg shadow-md overflow-hidden max-w-2xl mx-auto">
      <div className="p-6">
        <FormProgress step={step} totalSteps={totalSteps} />
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            {/* Step 1: Introduction & Privacy Notice */}
            {step === 1 && (
              <div>
                <h2 className="text-xl font-semibold text-[#374151] mb-4">Step Study Registration</h2>
                <p className="mb-6 text-[#374151]">Join a Celebrate Recovery Step Study to begin your healing journey in a safe, supportive environment.</p>
                
                <div className="mb-6">
                  <PrivacyNotice />
                </div>
                
                <FormField
                  control={form.control}
                  name="privacyConsent"
                  render={({ field }) => (
                    <FormItem className="mb-6 space-y-0">
                      <div className="flex items-start space-x-2">
                        <FormControl>
                          <Checkbox 
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="mt-1 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-sm text-[#374151]">
                            I understand that my participation is confidential and I can choose what personal information to share.
                          </FormLabel>
                        </div>
                      </div>
                      {form.formState.errors.privacyConsent && (
                        <p className="text-xs text-red-500 mt-1">{form.formState.errors.privacyConsent.message}</p>
                      )}
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end">
                  <Button 
                    type="button" 
                    onClick={() => nextStep(1)}
                    className="min-h-[44px] px-4 py-2 bg-primary text-white font-medium rounded-md shadow-sm hover:bg-blue-600"
                  >
                    Continue
                  </Button>
                </div>
              </div>
            )}
            
            {/* Step 2: Personal Information */}
            {step === 2 && (
              <div>
                <h2 className="text-xl font-semibold text-[#374151] mb-4">Personal Information</h2>
                <p className="mb-6 text-[#374151]">All fields below are optional. Share only what you're comfortable with.</p>
                
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel className="text-sm font-medium text-[#374151]">Name (Optional)</FormLabel>
                          <span className="text-xs text-[#9CA3AF]">Optional</span>
                        </div>
                        <FormControl>
                          <Input 
                            placeholder="Your name or a nickname" 
                            className="min-h-[44px] form-control block w-full px-3 py-2 border border-[#9CA3AF] rounded-md shadow-sm placeholder-[#9CA3AF] focus:ring-primary focus:border-primary"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription className="text-xs text-[#9CA3AF]">
                          You can use your first name, a nickname, or remain anonymous
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel className="text-sm font-medium text-[#374151]">Email Address</FormLabel>
                          <span className="text-xs text-[#9CA3AF]">Optional</span>
                        </div>
                        <FormControl>
                          <Input 
                            type="email"
                            placeholder="email@example.com" 
                            className="min-h-[44px] form-control block w-full px-3 py-2 border border-[#9CA3AF] rounded-md shadow-sm placeholder-[#9CA3AF] focus:ring-primary focus:border-primary"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription className="text-xs text-[#9CA3AF]">
                          Only used for study updates and reminders
                        </FormDescription>
                        {form.formState.errors.email && (
                          <p className="text-xs text-red-500">{form.formState.errors.email.message}</p>
                        )}
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel className="text-sm font-medium text-[#374151]">Phone Number</FormLabel>
                          <span className="text-xs text-[#9CA3AF]">Optional</span>
                        </div>
                        <FormControl>
                          <Input 
                            type="tel"
                            placeholder="(555) 555-5555" 
                            className="min-h-[44px] form-control block w-full px-3 py-2 border border-[#9CA3AF] rounded-md shadow-sm placeholder-[#9CA3AF] focus:ring-primary focus:border-primary"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription className="text-xs text-[#9CA3AF]">
                          Only used for urgent notifications
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="contactConsent"
                    render={({ field }) => (
                      <FormItem className="space-y-0">
                        <div className="flex items-start space-x-2">
                          <FormControl>
                            <Checkbox 
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              className="mt-1 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-sm text-[#374151]">
                              I consent to being contacted about the step study program via the contact methods provided above.
                            </FormLabel>
                          </div>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="mt-8 flex justify-between">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={prevStep}
                    className="min-h-[44px] px-4 py-2 bg-white text-[#374151] font-medium rounded-md border border-[#9CA3AF] shadow-sm hover:bg-gray-50"
                  >
                    Back
                  </Button>
                  <Button 
                    type="button" 
                    onClick={() => nextStep(2)}
                    className="min-h-[44px] px-4 py-2 bg-primary text-white font-medium rounded-md shadow-sm hover:bg-blue-600"
                  >
                    Continue
                  </Button>
                </div>
              </div>
            )}
            
            {/* Step 3: Group Preferences */}
            {step === 3 && (
              <div>
                <h2 className="text-xl font-semibold text-[#374151] mb-4">Group Preferences</h2>
                <p className="mb-6 text-[#374151]">Help us place you in a step study group that works best for you.</p>
                
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="groupType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-[#374151]">Preferred Group Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="min-h-[44px] w-full pl-3 pr-10 py-2 text-base border-[#9CA3AF] focus:outline-none focus:ring-primary focus:border-primary rounded-md">
                              <SelectValue placeholder="Select a group type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="men">Men's Group</SelectItem>
                            <SelectItem value="women">Women's Group</SelectItem>
                          </SelectContent>
                        </Select>
                        {form.formState.errors.groupType && (
                          <p className="text-xs text-red-500 mt-1">{form.formState.errors.groupType.message}</p>
                        )}
                      </FormItem>
                    )}
                  />
                  
                  <div className="mb-5">
                    <p className="text-sm text-[#6B7280] italic mb-3">
                      Please select the days and times you're available. We try to accommodate 
                      preferences, but groups may require some flexibility on your part.
                    </p>
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="availableDays"
                    render={({ field }) => (
                      <FormItem className="space-y-3 mb-6">
                        <FormLabel className="text-sm font-medium text-[#374151]">Available Days (Select all that apply)</FormLabel>
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                            <div className="flex items-start space-x-2">
                              <Checkbox
                                checked={Array.isArray(field.value) && field.value.includes('monday')}
                                onCheckedChange={(checked) => {
                                  const newValue = Array.isArray(field.value) ? [...field.value] : [];
                                  if (checked) {
                                    newValue.push('monday');
                                  } else {
                                    const index = newValue.indexOf('monday');
                                    if (index !== -1) newValue.splice(index, 1);
                                  }
                                  field.onChange(newValue);
                                }}
                                className="mt-1 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                              />
                              <FormLabel className="text-sm text-[#374151]">Monday</FormLabel>
                            </div>
                            
                            <div className="flex items-start space-x-2">
                              <Checkbox
                                checked={Array.isArray(field.value) && field.value.includes('tuesday')}
                                onCheckedChange={(checked) => {
                                  const newValue = Array.isArray(field.value) ? [...field.value] : [];
                                  if (checked) {
                                    newValue.push('tuesday');
                                  } else {
                                    const index = newValue.indexOf('tuesday');
                                    if (index !== -1) newValue.splice(index, 1);
                                  }
                                  field.onChange(newValue);
                                }}
                                className="mt-1 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                              />
                              <FormLabel className="text-sm text-[#374151]">Tuesday</FormLabel>
                            </div>
                            
                            <div className="flex items-start space-x-2">
                              <Checkbox
                                checked={Array.isArray(field.value) && field.value.includes('wednesday')}
                                onCheckedChange={(checked) => {
                                  const newValue = Array.isArray(field.value) ? [...field.value] : [];
                                  if (checked) {
                                    newValue.push('wednesday');
                                  } else {
                                    const index = newValue.indexOf('wednesday');
                                    if (index !== -1) newValue.splice(index, 1);
                                  }
                                  field.onChange(newValue);
                                }}
                                className="mt-1 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                              />
                              <FormLabel className="text-sm text-[#374151]">Wednesday</FormLabel>
                            </div>
                            
                            <div className="flex items-start space-x-2">
                              <Checkbox
                                checked={Array.isArray(field.value) && field.value.includes('thursday')}
                                onCheckedChange={(checked) => {
                                  const newValue = Array.isArray(field.value) ? [...field.value] : [];
                                  if (checked) {
                                    newValue.push('thursday');
                                  } else {
                                    const index = newValue.indexOf('thursday');
                                    if (index !== -1) newValue.splice(index, 1);
                                  }
                                  field.onChange(newValue);
                                }}
                                className="mt-1 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                              />
                              <FormLabel className="text-sm text-[#374151]">Thursday</FormLabel>
                            </div>
                            
                            <div className="flex items-start space-x-2">
                              <Checkbox
                                checked={Array.isArray(field.value) && field.value.includes('friday')}
                                onCheckedChange={(checked) => {
                                  const newValue = Array.isArray(field.value) ? [...field.value] : [];
                                  if (checked) {
                                    newValue.push('friday');
                                  } else {
                                    const index = newValue.indexOf('friday');
                                    if (index !== -1) newValue.splice(index, 1);
                                  }
                                  field.onChange(newValue);
                                }}
                                className="mt-1 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                              />
                              <FormLabel className="text-sm text-[#374151]">Friday</FormLabel>
                            </div>
                            
                            <div className="flex items-start space-x-2">
                              <Checkbox
                                checked={Array.isArray(field.value) && field.value.includes('saturday')}
                                onCheckedChange={(checked) => {
                                  const newValue = Array.isArray(field.value) ? [...field.value] : [];
                                  if (checked) {
                                    newValue.push('saturday');
                                  } else {
                                    const index = newValue.indexOf('saturday');
                                    if (index !== -1) newValue.splice(index, 1);
                                  }
                                  field.onChange(newValue);
                                }}
                                className="mt-1 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                              />
                              <FormLabel className="text-sm text-[#374151]">Saturday</FormLabel>
                            </div>
                            
                            <div className="flex items-start space-x-2">
                              <Checkbox
                                checked={Array.isArray(field.value) && field.value.includes('sunday')}
                                onCheckedChange={(checked) => {
                                  const newValue = Array.isArray(field.value) ? [...field.value] : [];
                                  if (checked) {
                                    newValue.push('sunday');
                                  } else {
                                    const index = newValue.indexOf('sunday');
                                    if (index !== -1) newValue.splice(index, 1);
                                  }
                                  field.onChange(newValue);
                                }}
                                className="mt-1 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                              />
                              <FormLabel className="text-sm text-[#374151]">Sunday</FormLabel>
                            </div>
                          </div>
                        </div>
                        {form.formState.errors.availableDays && (
                          <p className="text-xs text-red-500 mt-1">{form.formState.errors.availableDays.message}</p>
                        )}
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="availableTimes"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel className="text-sm font-medium text-[#374151]">Available Times (Select all that apply)</FormLabel>
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            <div className="flex items-start space-x-2">
                              <Checkbox
                                checked={Array.isArray(field.value) && field.value.includes('morning')}
                                onCheckedChange={(checked) => {
                                  const newValue = Array.isArray(field.value) ? [...field.value] : [];
                                  if (checked) {
                                    newValue.push('morning');
                                  } else {
                                    const index = newValue.indexOf('morning');
                                    if (index !== -1) newValue.splice(index, 1);
                                  }
                                  field.onChange(newValue);
                                }}
                                className="mt-1 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                              />
                              <FormLabel className="text-sm text-[#374151]">Morning (8am-12pm)</FormLabel>
                            </div>
                            
                            <div className="flex items-start space-x-2">
                              <Checkbox
                                checked={Array.isArray(field.value) && field.value.includes('afternoon')}
                                onCheckedChange={(checked) => {
                                  const newValue = Array.isArray(field.value) ? [...field.value] : [];
                                  if (checked) {
                                    newValue.push('afternoon');
                                  } else {
                                    const index = newValue.indexOf('afternoon');
                                    if (index !== -1) newValue.splice(index, 1);
                                  }
                                  field.onChange(newValue);
                                }}
                                className="mt-1 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                              />
                              <FormLabel className="text-sm text-[#374151]">Afternoon (12pm-5pm)</FormLabel>
                            </div>
                            
                            <div className="flex items-start space-x-2">
                              <Checkbox
                                checked={Array.isArray(field.value) && field.value.includes('evening')}
                                onCheckedChange={(checked) => {
                                  const newValue = Array.isArray(field.value) ? [...field.value] : [];
                                  if (checked) {
                                    newValue.push('evening');
                                  } else {
                                    const index = newValue.indexOf('evening');
                                    if (index !== -1) newValue.splice(index, 1);
                                  }
                                  field.onChange(newValue);
                                }}
                                className="mt-1 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                              />
                              <FormLabel className="text-sm text-[#374151]">Evening (5pm-9pm)</FormLabel>
                            </div>
                          </div>
                        </div>
                        {form.formState.errors.availableTimes && (
                          <p className="text-xs text-red-500 mt-1">{form.formState.errors.availableTimes.message}</p>
                        )}
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="additionalNotes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-[#374151]">Additional Notes</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Any additional information you'd like us to know..." 
                            className="min-h-[44px] form-control block w-full px-3 py-2 border border-[#9CA3AF] rounded-md shadow-sm placeholder-[#9CA3AF] focus:ring-primary focus:border-primary"
                            rows={3}
                            {...field} 
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="mt-8 flex justify-between">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={prevStep}
                    className="min-h-[44px] px-4 py-2 bg-white text-[#374151] font-medium rounded-md border border-[#9CA3AF] shadow-sm hover:bg-gray-50"
                  >
                    Back
                  </Button>
                  <Button 
                    type="submit"
                    disabled={registration.isPending} 
                    className="min-h-[44px] px-4 py-2 bg-primary text-white font-medium rounded-md shadow-sm hover:bg-blue-600"
                  >
                    {registration.isPending ? "Submitting..." : "Submit Registration"}
                  </Button>
                </div>
              </div>
            )}
          </form>
        </Form>
      </div>
    </Card>
  );
}
