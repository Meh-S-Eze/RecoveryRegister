import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

interface DatePickerProps {
  date?: Date;
  onSelect: (date: Date | undefined) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  showClearButton?: boolean;
}

export function DatePicker({
  date,
  onSelect,
  disabled,
  className,
  placeholder = "Select date",
  showClearButton = true,
}: DatePickerProps) {
  const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);

  const handleSelect = (selectedDate: Date | undefined) => {
    onSelect(selectedDate);
    setIsPopoverOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(undefined);
  };

  return (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "PPP") : placeholder}
            </div>
            {showClearButton && date && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 rounded-full"
                onClick={handleClear}
              >
                <span className="sr-only">Clear date</span>
                <span className="text-xs">✕</span>
              </Button>
            )}
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

// Input variant of DatePicker that looks like a standard form input
export function InputDatePicker({
  date,
  onSelect,
  disabled,
  className,
  placeholder = "Select date",
}: DatePickerProps) {
  const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);
  
  return (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
      <PopoverTrigger asChild>
        <div className="relative">
          <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <FormControl>
            <Input
              placeholder={placeholder}
              value={date ? format(date, "PPP") : ""}
              className={cn("pl-10", className)}
              disabled={disabled}
              readOnly
            />
          </FormControl>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(date) => {
            onSelect(date);
            setIsPopoverOpen(false);
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
} 