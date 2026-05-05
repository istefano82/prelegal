"use client";

import { useRouter, usePathname } from "next/navigation";
import { AuthButton } from "./AuthButton";

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();

  const isHome = pathname === "/";
  const isDocuments = pathname === "/documents";

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo/Brand */}
        <button
          onClick={() => router.push("/")}
          className="text-2xl font-bold text-blue-600 hover:text-blue-700 transition-colors"
        >
          PreLegal
        </button>

        {/* Navigation Links */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => router.push("/")}
            className={`font-medium transition-colors ${
              isHome
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-700 hover:text-gray-900"
            }`}
          >
            New NDA
          </button>
          <button
            onClick={() => router.push("/documents")}
            className={`font-medium transition-colors ${
              isDocuments
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-700 hover:text-gray-900"
            }`}
          >
            My Documents
          </button>
        </div>

        {/* Auth Button */}
        <AuthButton />
      </div>
    </nav>
  );
}
