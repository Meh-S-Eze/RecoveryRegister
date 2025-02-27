import { RegistrationForm } from "./RegistrationForm";

export function RegistrationPage() {
  return (
    <div className="container mx-auto py-10">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">
          Register for an Upcoming Study Session
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Thank you for your interest in joining our study sessions. Please complete 
          the registration form below to help us find the best group for you.
        </p>
      </div>

      <RegistrationForm />
    </div>
  );
} 