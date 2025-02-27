import { FormField, FormControl, FormItem, FormLabel, FormDescription } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { FormValues } from "../types";

interface PersonalInfoStepProps {
  form: UseFormReturn<FormValues>;
  onNext: () => void;
  onBack: () => void;
}

export function PersonalInfoStep({ form, onNext, onBack }: PersonalInfoStepProps) {
  const nextStep = async () => {
    const isValid = await form.trigger(["name", "email", "phone", "contactConsent"]);
    if (isValid) onNext();
  };

  return (
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
                You can use a nickname, made-up name, or any name you prefer - it doesn't have to be your real name
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
              <div className="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded">
                <FormControl>
                  <Checkbox 
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="mt-1 h-5 w-5 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                </FormControl>
                <div className="space-y-1 leading-none flex-1">
                  <FormLabel className="text-sm text-[#374151] cursor-pointer">
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
          onClick={onBack}
          className="min-h-[44px] px-4 py-2 bg-white text-[#374151] font-medium rounded-md border border-[#9CA3AF] shadow-sm hover:bg-gray-50"
        >
          Back
        </Button>
        <Button 
          type="button" 
          onClick={nextStep}
          className="min-h-[44px] px-4 py-2 bg-primary text-white font-medium rounded-md shadow-sm hover:bg-blue-600"
        >
          Continue
        </Button>
      </div>
    </div>
  );
} 