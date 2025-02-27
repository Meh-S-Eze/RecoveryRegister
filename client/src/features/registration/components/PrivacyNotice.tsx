export function PrivacyNotice() {
  return (
    <div className="bg-gray-50 p-4 rounded-md mb-4 text-sm text-gray-700">
      <h3 className="font-semibold mb-2">Privacy Notice</h3>
      <p className="mb-2">
        We respect your privacy and are committed to protecting your personal information. 
        The information you provide will only be used for:
      </p>
      <ul className="list-disc pl-5 mb-2 space-y-1">
        <li>Organizing study sessions and group assignments</li>
        <li>Sending notifications about your study group (only if you consent)</li>
        <li>Improving our programs and services</li>
      </ul>
      <p className="mb-2">
        Your personal information will not be shared with third parties outside of our organization. 
        You may choose to remain anonymous within your study group by using an alternate name.
      </p>
      <p>
        You can request access to, correction, or deletion of your information at any time by 
        contacting us directly.
      </p>
    </div>
  );
} 