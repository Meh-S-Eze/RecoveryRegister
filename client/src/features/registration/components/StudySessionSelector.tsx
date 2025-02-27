import { FormField, FormItem } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { StudySession, FormValues } from "../types";

interface StudySessionSelectorProps {
  form: UseFormReturn<FormValues>;
  studySessions: StudySession[];
  isLoading: boolean;
  isError: boolean;
  selectedGroupType: string;
  setSelectedGroupType: (type: string) => void;
  showCustomTimes: boolean;
  setShowCustomTimes: (show: boolean) => void;
}

export function StudySessionSelector({
  form,
  studySessions,
  isLoading,
  isError,
  selectedGroupType,
  setSelectedGroupType,
  showCustomTimes,
  setShowCustomTimes
}: StudySessionSelectorProps) {
  // Filter sessions based on selected group type
  const filteredSessions = studySessions.filter(session => session.groupType === selectedGroupType);

  return (
    <div className="mb-6 border rounded-lg p-5 bg-white shadow-sm">
      <div className="flex flex-col mb-4 gap-3">
        <h3 className="text-base font-medium text-[#374151]">Available Study Sessions</h3>
        
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant={selectedGroupType === "men" ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setSelectedGroupType("men");
              form.setValue("groupType", "men");
            }}
            className="h-9 w-full text-xs sm:text-sm"
          >
            Men's Groups
          </Button>
          <Button
            type="button"
            variant={selectedGroupType === "women" ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setSelectedGroupType("women");
              form.setValue("groupType", "women");
            }}
            className="h-9 w-full text-xs sm:text-sm"
          >
            Women's Groups
          </Button>
        </div>
        {form.formState.errors.groupType && (
          <p className="text-xs text-red-500 mt-1">{form.formState.errors.groupType.message}</p>
        )}
      </div>
      
      {isLoading && (
        <div className="text-center p-4">
          <p className="text-sm text-[#6B7280]">Loading available sessions...</p>
        </div>
      )}
      
      {isError && (
        <div className="text-center p-4 text-red-500">
          <p className="text-sm">Error loading sessions. Please try again.</p>
        </div>
      )}
      
      {!isLoading && !isError && filteredSessions.length === 0 && (
        <div className="text-center p-8 bg-gray-50 rounded-lg border border-gray-100">
          <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-3">
            <CalendarIcon className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-[#6B7280] font-medium">No scheduled sessions available</p>
          <p className="text-sm text-[#9CA3AF] mt-1">
            {selectedGroupType ? "Try selecting a different group type" : "Please check back later"}
          </p>
        </div>
      )}
      
      {!isLoading && !isError && filteredSessions.length > 0 && (
        <FormField
          control={form.control}
          name="sessionId"
          render={({ field }) => (
            <FormItem>
              <div className="space-y-4">
                {filteredSessions.map((session: StudySession) => (
                  <div 
                    key={session.id} 
                    className={`border rounded-md p-4 cursor-pointer transition-colors hover:shadow-md ${
                      field.value === session.id 
                        ? 'border-primary bg-primary/5' 
                        : 'border-gray-200 hover:border-primary/30'
                    }`}
                    onClick={() => {
                      field.onChange(session.id);
                      setShowCustomTimes(false);
                      form.setValue("flexibilityOption", "preferred_session");
                      // Ensure the group type is set to match the selected session
                      // Use type assertion to ensure the session.groupType is treated as "men" | "women"
                      const groupType = session.groupType === "men" ? "men" : "women";
                      setSelectedGroupType(groupType);
                      form.setValue("groupType", groupType);
                    }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-[#374151]">{session.title}</h4>
                      <div className="flex gap-2">
                        <Badge variant="outline" className="text-xs bg-gray-50">
                          {session.groupType === 'men' ? 'Men' : 'Women'}
                        </Badge>
                        {session.capacity !== null && session.capacity !== undefined && (
                          <Badge variant="outline" className="text-xs">
                            Capacity: {session.capacity}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {session.description && (
                      <p className="text-sm text-[#6B7280] mb-2">{session.description}</p>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-[#374151] font-medium">When: </span>
                        <span className="text-[#6B7280]">{session.date}, {session.time}</span>
                      </div>
                      <div>
                        <span className="text-[#374151] font-medium">Where: </span>
                        <span className="text-[#6B7280]">{session.location}</span>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* "Other" option button */}
                <div 
                  className={`border rounded-md p-4 cursor-pointer transition-colors hover:shadow-md ${
                    showCustomTimes 
                      ? 'border-primary bg-primary/5' 
                      : 'border-gray-200 hover:border-primary/30'
                  }`}
                  onClick={() => {
                    form.setValue("sessionId", undefined);
                    setShowCustomTimes(!showCustomTimes);
                    form.setValue("flexibilityOption", "flexible_schedule");
                  }}
                >
                  <div className="flex items-center">
                    <div className="mr-3 h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                      <CalendarIcon className="h-4 w-4 text-gray-500" />
                    </div>
                    <div>
                      <h4 className="font-medium text-[#374151]">Other - Times that would work for me</h4>
                    </div>
                  </div>
                </div>
              </div>
              {form.formState.errors.sessionId && (
                <p className="text-xs text-red-500 mt-2">{form.formState.errors.sessionId.message}</p>
              )}
            </FormItem>
          )}
        />
      )}
    </div>
  );
} 