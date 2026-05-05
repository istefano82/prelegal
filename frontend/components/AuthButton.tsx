"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { AuthModal } from "./AuthModal";
import { UserMenu } from "./UserMenu";

export function AuthButton() {
  const { state } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (state.status === "authenticated" && state.user) {
    return <UserMenu />;
  }

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm"
      >
        Sign In
      </button>
      <AuthModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
