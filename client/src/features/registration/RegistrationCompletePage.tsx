import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { CheckCircle } from "lucide-react";

export function RegistrationCompletePage() {
  return (
    <div className="container mx-auto py-10">
      <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md text-center">
        <div className="flex justify-center mb-4">
          <CheckCircle className="h-16 w-16 text-green-500" />
        </div>
        
        <h1 className="text-2xl font-bold mb-4 text-gray-900">
          Registration Complete!
        </h1>
        
        <p className="text-gray-600 mb-6">
          Thank you for registering for a study session. We've received your information
          and will contact you shortly with details about your group assignment.
        </p>
        
        <div className="space-y-4">
          <Button asChild className="w-full">
            <Link to="/">Return to Home</Link>
          </Button>
          
          <Button variant="outline" asChild className="w-full">
            <Link to="/resources">Browse Resources</Link>
          </Button>
        </div>
      </div>
    </div>
  );
} 