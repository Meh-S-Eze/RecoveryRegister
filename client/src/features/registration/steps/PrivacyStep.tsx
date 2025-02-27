import { FormField, FormControl, FormItem, FormLabel } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { PrivacyNotice } from "../components/PrivacyNotice";
import { UseFormReturn } from "react-hook-form";
import { FormValues } from "../types";

interface PrivacyStepProps {
  form: UseFormReturn<FormValues>;
  onNext: () => void;
}

export function PrivacyStep({ form, onNext }: PrivacyStepProps) {
  const nextStep = async () => {
    const isValid = await form.trigger("privacyConsent");
    if (isValid) onNext();
  };

  return (
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
          onClick={nextStep}
          className="min-h-[44px] px-4 py-2 bg-primary text-white font-medium rounded-md shadow-sm hover:bg-blue-600"
        >
          Continue
        </Button>
      </div>
    </div>
  );
} 