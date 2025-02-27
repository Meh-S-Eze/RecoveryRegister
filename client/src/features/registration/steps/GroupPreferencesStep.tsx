import { FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { UseFormReturn } from "react-hook-form";
import { FormValues, StudySession } from "../types";
import { StudySessionSelector } from "../components/StudySessionSelector";
import { AvailabilitySelector } from "../components/AvailabilitySelector";

interface GroupPreferencesStepProps {
  form: UseFormReturn<FormValues>;
  onBack: () => void;
  studySessions: StudySession[];
  isLoading: boolean;
  isError: boolean;
  selectedGroupType: string;
  setSelectedGroupType: (type: string) => void;
  showCustomTimes: boolean;
  setShowCustomTimes: (show: boolean) => void;
  isSubmitting: boolean;
}

export function GroupPreferencesStep({ 
  form, 
  onBack, 
  studySessions,
  isLoading,
  isError,
  selectedGroupType,
  setSelectedGroupType,
  showCustomTimes,
  setShowCustomTimes,
  isSubmitting
}: GroupPreferencesStepProps) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-[#374151] mb-4">Group Preferences</h2>
      <p className="mb-6 text-[#374151]">Help us place you in a step study group that works best for you.</p>
      
      <div className="space-y-6">
        {/* Hidden field to maintain the groupType value */}
        <input 
          type="hidden" 
          name="groupType"
          value={selectedGroupType} 
        />
        
        {/* Hidden field to maintain the flexibilityOption value */}
        <input 
          type="hidden" 
          value={showCustomTimes ? "flexible_schedule" : "preferred_session"} 
          onChange={(e) => form.setValue("flexibilityOption", e.target.value)}
        />
        
        {/* Show study sessions if user selected preferred sessions */}
        <StudySessionSelector
          form={form}
          studySessions={studySessions}
          isLoading={isLoading}
          isError={isError}
          selectedGroupType={selectedGroupType}
          setSelectedGroupType={setSelectedGroupType}
          showCustomTimes={showCustomTimes}
          setShowCustomTimes={setShowCustomTimes}
        />
        
        {/* Show custom times only when explicitly selected */}
        {showCustomTimes && (
          <AvailabilitySelector form={form} />
        )}
        
        <FormField
          control={form.control}
          name="additionalNotes"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-[#374151]">Additional Notes</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Anything else we should know about your preferences or scheduling constraints?" 
                  className="min-h-[100px] w-full p-3 border border-[#9CA3AF] rounded-md shadow-sm placeholder-[#9CA3AF] focus:ring-primary focus:border-primary"
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
          onClick={onBack}
          className="min-h-[44px] px-4 py-2 bg-white text-[#374151] font-medium rounded-md border border-[#9CA3AF] shadow-sm hover:bg-gray-50"
        >
          Back
        </Button>
        <Button 
          type="submit"
          disabled={isSubmitting}
          className="min-h-[44px] px-4 py-2 bg-primary text-white font-medium rounded-md shadow-sm hover:bg-blue-600"
        >
          {isSubmitting ? "Submitting..." : "Register"}
        </Button>
      </div>
    </div>
  );
} 