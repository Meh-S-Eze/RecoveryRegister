import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type DayOfWeek = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

const DAYS_OF_WEEK: { value: DayOfWeek; label: string }[] = [
  { value: "monday", label: "Monday" },
  { value: "tuesday", label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday", label: "Thursday" },
  { value: "friday", label: "Friday" },
  { value: "saturday", label: "Saturday" },
  { value: "sunday", label: "Sunday" },
];

interface DaySelectorProps {
  selected?: DayOfWeek;
  onSelect: (day: DayOfWeek) => void;
  disabled?: boolean;
  className?: string;
}

export function DaySelector({
  selected,
  onSelect,
  disabled,
  className,
}: DaySelectorProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {DAYS_OF_WEEK.map((day) => (
        <button
          key={day.value}
          type="button"
          onClick={() => onSelect(day.value)}
          disabled={disabled}
          className={cn(
            "flex h-9 items-center justify-center rounded-md border border-input px-3 py-1 text-sm",
            "transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            selected === day.value 
              ? "bg-primary text-primary-foreground hover:bg-primary/90" 
              : "bg-background",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          {day.label}
          {selected === day.value && <Check className="ml-1 h-4 w-4" />}
        </button>
      ))}
    </div>
  );
}

interface MultiDaySelectorProps {
  selected: DayOfWeek[];
  onSelect: (days: DayOfWeek[]) => void;
  disabled?: boolean;
  className?: string;
}

export function MultiDaySelector({
  selected,
  onSelect,
  disabled,
  className,
}: MultiDaySelectorProps) {
  const handleToggleDay = (day: DayOfWeek) => {
    if (selected.includes(day)) {
      onSelect(selected.filter(d => d !== day));
    } else {
      onSelect([...selected, day]);
    }
  };

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {DAYS_OF_WEEK.map((day) => (
        <button
          key={day.value}
          type="button"
          onClick={() => handleToggleDay(day.value)}
          disabled={disabled}
          className={cn(
            "flex h-9 items-center justify-center rounded-md border border-input px-3 py-1 text-sm",
            "transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            selected.includes(day.value) 
              ? "bg-primary text-primary-foreground hover:bg-primary/90" 
              : "bg-background",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          {day.label}
          {selected.includes(day.value) && <Check className="ml-1 h-4 w-4" />}
        </button>
      ))}
    </div>
  );
} 