import { z } from "zod";

// Define the study session type
export interface StudySession {
  id: number;
  title: string;
  description: string | null;
  location: string;
  date: string;
  time: string;
  groupType: string;
  capacity: number | null;
  isActive: boolean;
  createdAt: string;
}

// Form schema
export const formSchema = z.object({
  // Step 1
  privacyConsent: z.boolean().refine(val => val === true, {
    message: "You must acknowledge the privacy notice to continue."
  }),
  
  // Step 2
  name: z.string().optional(),
  email: z.string().email("Please enter a valid email address").optional().or(z.literal("")),
  phone: z.string().optional(),
  contactConsent: z.boolean().default(false),
  
  // Step 3
  groupType: z.enum(["men", "women"]).default("men"),
  
  // Study session selection
  flexibilityOption: z.enum(["preferred_session", "flexible_schedule"]).default("preferred_session"),
  sessionId: z.number().optional().nullable(),
  
  // Custom availability
  availableDays: z.array(z.string()).default([]),
  availableTimes: z.array(z.string()).default([]),
  additionalNotes: z.string().optional().nullable()
}).refine(
  (data) => {
    // If user chose flexible schedule, they should select at least one day and one time
    if (data.flexibilityOption === "flexible_schedule") {
      return data.availableDays.length > 0 && data.availableTimes.length > 0;
    }
    
    // If user chose a preferred session, they should select a session
    if (data.flexibilityOption === "preferred_session") {
      return !!data.sessionId;
    }
    
    return true;
  },
  {
    message: "Please complete your group preferences before submitting",
    path: ["flexibilityOption"] // This will show the error on the flexibility option field
  }
);

export type FormValues = z.infer<typeof formSchema>; 