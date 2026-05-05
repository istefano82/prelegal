"use client";

import { useAuth } from "./useAuth";

export function useSession() {
  const { state } = useAuth();

  return {
    sessionId: state.sessionId,
    isAuthenticated: state.status === "authenticated",
    user: state.user,
  };
}
