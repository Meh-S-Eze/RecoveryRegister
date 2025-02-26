interface FormProgressProps {
  step: number;
  totalSteps: number;
}

export function FormProgress({ step, totalSteps }: FormProgressProps) {
  const progressPercentage = Math.round((step / totalSteps) * 100);
  
  return (
    <div className="relative h-1.5 bg-[#E5E7EB] rounded-full mb-8">
      <div 
        className="h-full rounded-full bg-primary transition-all duration-500 ease-in-out"
        style={{ width: `${progressPercentage}%` }}
      />
    </div>
  );
}
