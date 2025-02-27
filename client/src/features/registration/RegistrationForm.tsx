import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

import { FormProgress } from "./components/FormProgress";
import { PrivacyStep } from "./steps/PrivacyStep";
import { PersonalInfoStep } from "./steps/PersonalInfoStep";
import { GroupPreferencesStep } from "./steps/GroupPreferencesStep";
import { FormValues, formSchema } from "./types";
import { registerParticipant } from "@/lib/api";

export function RegistrationForm() {
  const [step, setStep] = useState(1);
  const [groupType, setGroupType] = useState<"men" | "women">("men");
  const [showCustomTimes, setShowCustomTimes] = useState(false);
  const totalSteps = 3;
  const navigate = useNavigate();

  // Create wrapper functions to match the expected function signatures
  const handleSetGroupType = (type: string) => {
    setGroupType(type as "men" | "women");
  };

  const handleSetShowCustomTimes = (show: boolean) => {
    setShowCustomTimes(show);
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      privacyConsent: false,
      name: "",
      email: "",
      phone: "",
      contactConsent: false,
      groupType: "men",
      flexibilityOption: "preferred_session",
      sessionId: undefined,
      availableDays: [],
      availableTimes: [],
      additionalNotes: "",
    },
  });

  const { mutate, isPending, error } = useMutation({
    mutationFn: registerParticipant,
    onSuccess: () => {
      toast.success("Registration successful!");
      navigate("/registration-complete");
    },
    onError: (error) => {
      console.error("Registration error:", error);
      toast.error("An error occurred during registration. Please try again.");
    },
  });

  const handleSubmit = (data: FormValues) => {
    try {
      // Log form data for debugging
      console.log("Form data before submit:", data);
      
      // Transform the data before sending to the server if needed
      const sanitizedData = {
        ...data,
        email: data.email || "", // Ensure email is never null
      };
      
      console.log("Sanitized data to submit:", sanitizedData);
      
      // Attempt to submit the form
      mutate(sanitizedData);
    } catch (err) {
      console.error("Error during form submission process:", err);
      toast.error("There was a problem submitting the form. Please try again.");
    }
  };

  const nextStep = () => setStep((prev) => Math.min(prev + 1, totalSteps));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  // Mock data for study sessions until API integration
  const mockStudySessions = [
    {
      id: 1,
      title: "Tuesday Evening Men's Group",
      description: "Weekly men's step study at the main campus",
      location: "Main Building, Room 202",
      date: "Every Tuesday",
      time: "7:00 PM - 9:00 PM",
      groupType: "men",
      capacity: 12,
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 2,
      title: "Thursday Morning Women's Group",
      description: "Weekly women's step study with childcare available",
      location: "Main Building, Room 101",
      date: "Every Thursday",
      time: "10:00 AM - 12:00 PM",
      groupType: "women",
      capacity: 15,
      isActive: true,
      createdAt: new Date().toISOString(),
    },
  ];

  // Display any mutation errors
  if (error) {
    console.error("Mutation error details:", error);
  }

  return (
    <div className="w-full max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <FormProgress step={step} totalSteps={totalSteps} />

      <form onSubmit={form.handleSubmit(handleSubmit)}>
        {step === 1 && (
          <PrivacyStep 
            form={form} 
            onNext={nextStep} 
          />
        )}

        {step === 2 && (
          <PersonalInfoStep 
            form={form} 
            onNext={nextStep} 
            onBack={prevStep} 
          />
        )}

        {step === 3 && (
          <GroupPreferencesStep 
            form={form} 
            onBack={prevStep} 
            studySessions={mockStudySessions}
            isLoading={false}
            isError={false}
            selectedGroupType={groupType}
            setSelectedGroupType={handleSetGroupType}
            showCustomTimes={showCustomTimes}
            setShowCustomTimes={handleSetShowCustomTimes}
            isSubmitting={isPending}
          />
        )}
      </form>
    </div>
  );
} 