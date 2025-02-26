import { RegistrationSteps } from "@/components/RegistrationSteps";
import { Helmet } from "react-helmet";

export default function RegistrationForm() {
  return (
    <div className="max-w-2xl w-full mx-auto px-4 py-6 sm:px-6 lg:px-8">
      <Helmet>
        <title>Register for Step Study | Celebrate Recovery</title>
      </Helmet>
      <RegistrationSteps />
    </div>
  );
}
