import { FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { UseFormReturn } from "react-hook-form";
import { FormValues } from "../types";

interface AvailabilitySelectorProps {
  form: UseFormReturn<FormValues>;
}

export function AvailabilitySelector({ form }: AvailabilitySelectorProps) {
  return (
    <div className="border rounded-lg p-5 mt-4 bg-white shadow-sm">
      <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-6">
        <p className="text-sm text-amber-800 font-medium">Custom Availability</p>
        <p className="text-sm text-amber-700 mt-1">
          There are currently no other scheduled studies. You're indicating times that could work for you
          to be informed if one gets scheduled during those periods.
        </p>
      </div>
      
      <h3 className="text-base font-medium text-[#374151] mb-3">Your Availability</h3>
      <p className="text-sm text-[#6B7280] italic mb-4">
        Please select the days and times you're available. We try to accommodate 
        preferences, but groups may require some flexibility on your part.
      </p>
      
      <FormField
        control={form.control}
        name="availableDays"
        render={({ field }) => (
          <FormItem className="space-y-3 mb-6">
            <FormLabel className="text-sm font-medium text-[#374151]">Available Days (Select all that apply)</FormLabel>
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                <DayCheckbox day="monday" label="Monday" field={field} />
                <DayCheckbox day="tuesday" label="Tuesday" field={field} />
                <DayCheckbox day="wednesday" label="Wednesday" field={field} />
                <DayCheckbox day="thursday" label="Thursday" field={field} />
                <DayCheckbox day="friday" label="Friday" field={field} />
                <DayCheckbox day="saturday" label="Saturday" field={field} />
                <DayCheckbox day="sunday" label="Sunday" field={field} />
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
          <FormItem className="space-y-3 mb-6">
            <FormLabel className="text-sm font-medium text-[#374151]">Available Times (Select all that apply)</FormLabel>
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                <TimeCheckbox time="morning" label="Morning (8am-12pm)" field={field} />
                <TimeCheckbox time="afternoon" label="Afternoon (12pm-5pm)" field={field} />
                <TimeCheckbox time="evening" label="Evening (5pm-9pm)" field={field} />
              </div>
            </div>
            {form.formState.errors.availableTimes && (
              <p className="text-xs text-red-500 mt-1">{form.formState.errors.availableTimes.message}</p>
            )}
          </FormItem>
        )}
      />
    </div>
  );
}

// Helper component for day checkboxes
interface DayCheckboxProps {
  day: string;
  label: string;
  field: any;
}

function DayCheckbox({ day, label, field }: DayCheckboxProps) {
  return (
    <div className="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded">
      <Checkbox
        checked={Array.isArray(field.value) && field.value.includes(day)}
        onCheckedChange={(checked) => {
          const newValue = Array.isArray(field.value) ? [...field.value] : [];
          if (checked) {
            newValue.push(day);
          } else {
            const index = newValue.indexOf(day);
            if (index !== -1) newValue.splice(index, 1);
          }
          field.onChange(newValue);
        }}
        className="h-5 w-5 mt-0.5 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
      />
      <FormLabel className="text-sm text-[#374151] flex-1">{label}</FormLabel>
    </div>
  );
}

// Helper component for time checkboxes
interface TimeCheckboxProps {
  time: string;
  label: string;
  field: any;
}

function TimeCheckbox({ time, label, field }: TimeCheckboxProps) {
  return (
    <div className="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded">
      <Checkbox
        checked={Array.isArray(field.value) && field.value.includes(time)}
        onCheckedChange={(checked) => {
          const newValue = Array.isArray(field.value) ? [...field.value] : [];
          if (checked) {
            newValue.push(time);
          } else {
            const index = newValue.indexOf(time);
            if (index !== -1) newValue.splice(index, 1);
          }
          field.onChange(newValue);
        }}
        className="h-5 w-5 mt-0.5 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
      />
      <FormLabel className="text-sm text-[#374151] flex-1">{label}</FormLabel>
    </div>
  );
} 