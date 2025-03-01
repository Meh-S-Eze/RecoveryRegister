import { Link } from "wouter";

export function Header() {
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-2xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
        <Link href="/">
          <div className="flex items-center cursor-pointer">
            <span className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
              </svg>
            </span>
            <h1 className="ml-2 text-lg font-semibold text-[#374151]">Celebrate Recovery</h1>
          </div>
        </Link>
        {/* Help button removed - now using the dedicated HelpButton component */}
      </div>
    </header>
  );
}
