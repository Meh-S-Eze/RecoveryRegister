import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckIcon, InfoIcon } from "lucide-react";
import { Link } from "wouter";

export function ConfirmationMessage() {
  return (
    <Card className="bg-white rounded-lg shadow-md overflow-hidden max-w-2xl mx-auto">
      <CardContent className="p-6">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-[#2ECC71]">
            <CheckIcon className="h-6 w-6 text-white" />
          </div>
          <h2 className="mt-3 text-lg font-medium text-[#374151]">Registration Successful</h2>
          <p className="mt-2 text-[#374151]">Thank you for registering for a Celebrate Recovery Step Study!</p>
          
          <Alert className="mt-6 bg-blue-50 border-l-4 border-primary text-left">
            <div className="flex">
              <div className="flex-shrink-0">
                <InfoIcon className="h-5 w-5 text-primary" />
              </div>
              <AlertDescription className="ml-3">
                <p className="text-sm text-blue-700">
                  What happens next:
                </p>
                <ul className="mt-2 text-sm text-blue-700 list-disc list-inside">
                  <li>A group leader will review your registration</li>
                  <li>You'll be contacted about group placement (if you provided contact info)</li>
                  <li>If you chose to remain anonymous, please check back at our next meeting for group assignments</li>
                </ul>
              </AlertDescription>
            </div>
          </Alert>
          
          <div className="mt-6">
            <Link href="/">
              <Button 
                className="min-h-[44px] inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-blue-600"
              >
                Return to Home
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
