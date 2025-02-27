interface FormProgressProps {
  step: number;
  totalSteps: number;
}

export function FormProgress({ step, totalSteps }: FormProgressProps) {
  return (
    <div className="mb-6">
      <div className="flex justify-between mb-2">
        <span className="text-sm font-medium text-[#374151]">
          Step {step} of {totalSteps}
        </span>
        <span className="text-sm text-[#6B7280]">
          {Math.round((step / totalSteps) * 100)}% Complete
        </span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div 
          className="bg-primary h-2.5 rounded-full" 
          style={{ width: `${(step / totalSteps) * 100}%` }}
        ></div>
      </div>
    </div>
  );
} 