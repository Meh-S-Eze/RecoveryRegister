import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-2xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex justify-center md:justify-start space-x-6">
            <Link href="/privacy">
              <div className="text-[#9CA3AF] hover:text-primary cursor-pointer">
                Privacy Policy
              </div>
            </Link>
            <Link href="/contact">
              <div className="text-[#9CA3AF] hover:text-primary cursor-pointer">
                Contact
              </div>
            </Link>
            <Link href="/about">
              <div className="text-[#9CA3AF] hover:text-primary cursor-pointer">
                About
              </div>
            </Link>
            <Link href="/admin">
              <div className="text-[#9CA3AF] hover:text-primary cursor-pointer">
                Admin
              </div>
            </Link>
          </div>
          <div className="mt-4 md:mt-0">
            <p className="text-center text-sm text-[#9CA3AF]">
              &copy; {new Date().getFullYear()} Celebrate Recovery program. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
