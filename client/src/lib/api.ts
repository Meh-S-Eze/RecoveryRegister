import { FormValues } from "@/features/registration/types";

// Base API URL - should be configured via environment variables in a real app
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

/**
 * Register a new participant for a study session
 */
export async function registerParticipant(formData: FormValues): Promise<{ success: boolean, id?: number }> {
  console.log("API function called with data:", formData);
  
  try {
    const response = await fetch(`${API_URL}/participants`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });

    // Log response status for debugging
    console.log("API response status:", response.status);

    // Handle non-OK responses
    if (!response.ok) {
      let errorMessage = "Failed to register participant";
      
      try {
        const errorData = await response.json() as { message?: string };
        console.error("API error response:", errorData);
        errorMessage = errorData?.message || errorMessage;
      } catch (parseError) {
        console.error("Could not parse error response:", parseError);
      }
      
      throw new Error(errorMessage);
    }

    // Success case
    const responseData = await response.json() as { success: boolean, id?: number };
    console.log("API success response:", responseData);
    return responseData;
  } catch (error) {
    console.error("API call error:", error);
    throw error;
  }
}

/**
 * Fetch available study sessions
 */
export async function fetchStudySessions(): Promise<any[]> {
  try {
    const response = await fetch(`${API_URL}/sessions`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch study sessions');
    }
    
    return response.json();
  } catch (error) {
    console.error("Error fetching study sessions:", error);
    throw error;
  }
}

// Add other API functions as needed 