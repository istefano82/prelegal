"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

export function UserMenu() {
  const { state, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!state.user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-gray-900"
      >
        <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
          {state.user.name?.[0]?.toUpperCase() || state.user.email[0].toUpperCase()}
        </div>
        <span className="text-sm font-medium">{state.user.name || state.user.email}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
          <div className="p-3 border-b border-gray-200">
            <p className="text-sm font-semibold text-gray-900">{state.user.name || "User"}</p>
            <p className="text-xs text-gray-600">{state.user.email}</p>
          </div>
          <button
            onClick={async () => {
              await logout();
              setIsOpen(false);
            }}
            className="w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50 transition-colors"
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
