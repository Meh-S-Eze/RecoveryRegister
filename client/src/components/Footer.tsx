import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-2xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex justify-center md:justify-start space-x-6">
            <Link href="/privacy">
              <a className="text-[#9CA3AF] hover:text-primary">
                Privacy Policy
              </a>
            </Link>
            <Link href="/contact">
              <a className="text-[#9CA3AF] hover:text-primary">
                Contact
              </a>
            </Link>
            <Link href="/about">
              <a className="text-[#9CA3AF] hover:text-primary">
                About
              </a>
            </Link>
            <Link href="/admin">
              <a className="text-[#9CA3AF] hover:text-primary">
                Admin
              </a>
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
