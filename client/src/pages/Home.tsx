import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { Helmet } from "react-helmet";

export default function Home() {
  return (
    <div className="max-w-2xl w-full mx-auto px-4 py-6 sm:px-6 lg:px-8">
      <Helmet>
        <title>Step Study Registration | Celebrate Recovery</title>
      </Helmet>
      <Card className="bg-white rounded-lg shadow-md overflow-hidden">
        <CardContent className="p-6">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-[#374151] mb-4">Celebrate Recovery Step Study</h1>
            <p className="text-[#374151] max-w-lg mx-auto">
              Take the next step in your healing journey by joining a Celebrate Recovery Step Study group. 
              Our supportive and confidential environment helps you work through the principles and steps.
            </p>
          </div>
          
          <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 justify-center">
            <Link href="/register">
              <Button className="min-h-[44px] w-full sm:w-auto px-6 bg-primary text-white hover:bg-blue-600">
                Register for Step Study
              </Button>
            </Link>
            <Button 
              variant="outline" 
              className="min-h-[44px] w-full sm:w-auto px-6 border-[#9CA3AF] text-[#374151] hover:bg-gray-50"
            >
              Learn More
            </Button>
          </div>
          
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-[#374151] mb-2">What is a Step Study?</h3>
              <p className="text-sm text-[#374151]">
                A Step Study is a small group that provides a safe place to work through the 8 principles and 12 steps 
                of recovery using the Celebrate Recovery resources.
              </p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-[#374151] mb-2">How It Works</h3>
              <p className="text-sm text-[#374151]">
                Groups meet weekly for about 6-12 months, working through the program at a comfortable pace. 
                Your privacy is respected—share only what you're comfortable with.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
