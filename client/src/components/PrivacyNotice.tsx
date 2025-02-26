import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

export function PrivacyNotice() {
  return (
    <Alert className="bg-blue-50 border-l-4 border-primary">
      <InfoIcon className="h-5 w-5 text-primary" />
      <AlertTitle className="text-sm font-medium text-primary">
        Privacy Notice
      </AlertTitle>
      <AlertDescription className="mt-2 text-sm text-blue-700">
        <p>We understand the importance of privacy in your recovery journey:</p>
        <ul className="list-disc pl-5 mt-1 space-y-1">
          <li>All personal information is optional</li>
          <li>You can participate anonymously</li>
          <li>Your information is never shared outside the program</li>
          <li>Only group leaders will have access to contact details</li>
        </ul>
      </AlertDescription>
    </Alert>
  );
}
