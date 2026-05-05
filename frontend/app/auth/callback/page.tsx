"use client";

import { useEffect } from "react";

export default function AuthCallbackPage() {
  useEffect(() => {
    if (typeof window !== "undefined" && window.opener) {
      window.opener.postMessage(
        { type: "GOOGLE_AUTH_SUCCESS" },
        window.location.origin
      );
      window.close();
    }
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Authenticating...
        </h1>
        <p className="text-gray-600">Please wait while we complete your login.</p>
      </div>
    </div>
  );
}
