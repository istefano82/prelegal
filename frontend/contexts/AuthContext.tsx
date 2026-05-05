"use client";

import {
  createContext,
  useReducer,
  ReactNode,
  useCallback,
  useEffect,
  useState,
} from "react";

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
}

export interface AuthState {
  status: "loading" | "unauthenticated" | "authenticated";
  user: AuthUser | null;
  sessionId: string | null;
  error: string | null;
}

type AuthAction =
  | { type: "INIT"; payload: { sessionId: string } }
  | { type: "LOGIN_START" }
  | { type: "LOGIN_SUCCESS"; payload: { user: AuthUser; sessionId: string } }
  | { type: "LOGIN_ERROR"; payload: { error: string } }
  | { type: "LOGOUT" }
  | { type: "REFRESH_SUCCESS"; payload: { user: AuthUser } }
  | { type: "CLEAR_ERROR" };

const initialState: AuthState = {
  status: "loading",
  user: null,
  sessionId: null,
  error: null,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "INIT":
      return {
        ...state,
        status: "unauthenticated",
        sessionId: action.payload.sessionId,
      };
    case "LOGIN_START":
      return { ...state, status: "loading", error: null };
    case "LOGIN_SUCCESS":
      return {
        ...state,
        status: "authenticated",
        user: action.payload.user,
        sessionId: action.payload.sessionId,
        error: null,
      };
    case "LOGIN_ERROR":
      return {
        ...state,
        status: "unauthenticated",
        error: action.payload.error,
      };
    case "LOGOUT":
      return {
        ...state,
        status: "unauthenticated",
        user: null,
        sessionId: localStorage.getItem("sessionId") || null,
        error: null,
      };
    case "REFRESH_SUCCESS":
      return {
        ...state,
        user: action.payload.user,
      };
    case "CLEAR_ERROR":
      return { ...state, error: null };
    default:
      return state;
  }
}

export interface AuthContextType {
  state: AuthState;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  googleLogin: (code: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      let sessionId = localStorage.getItem("sessionId");
      if (!sessionId) {
        sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem("sessionId", sessionId);
      }

      dispatch({ type: "INIT", payload: { sessionId } });

      try {
        const response = await fetch("/auth/me", {
          credentials: "include",
        });
        if (response.ok) {
          const user = await response.json();
          dispatch({
            type: "LOGIN_SUCCESS",
            payload: { user, sessionId: sessionId || "" },
          });
        } else {
          dispatch({ type: "INIT", payload: { sessionId } });
        }
      } catch {
        dispatch({ type: "INIT", payload: { sessionId } });
      }
      setIsInitialized(true);
    };

    initAuth();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    dispatch({ type: "LOGIN_START" });
    try {
      const response = await fetch("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error("Login failed");
      }

      const { user } = await response.json();
      const sessionId = localStorage.getItem("sessionId") || "";
      dispatch({
        type: "LOGIN_SUCCESS",
        payload: { user, sessionId },
      });
    } catch (error) {
      dispatch({
        type: "LOGIN_ERROR",
        payload: {
          error: error instanceof Error ? error.message : "Login failed",
        },
      });
      throw error;
    }
  }, []);

  const register = useCallback(
    async (email: string, password: string, name?: string) => {
      dispatch({ type: "LOGIN_START" });
      try {
        const response = await fetch("/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email, password, name }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(
            error.error?.message || "Registration failed"
          );
        }

        const { user } = await response.json();
        const sessionId = localStorage.getItem("sessionId") || "";
        dispatch({
          type: "LOGIN_SUCCESS",
          payload: { user, sessionId },
        });
      } catch (error) {
        dispatch({
          type: "LOGIN_ERROR",
          payload: {
            error:
              error instanceof Error
                ? error.message
                : "Registration failed",
          },
        });
        throw error;
      }
    },
    []
  );

  const googleLogin = useCallback(async (code: string) => {
    dispatch({ type: "LOGIN_START" });
    try {
      const response = await fetch("/auth/google/callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        throw new Error("Google login failed");
      }

      const { user } = await response.json();
      const sessionId = localStorage.getItem("sessionId") || "";
      dispatch({
        type: "LOGIN_SUCCESS",
        payload: { user, sessionId },
      });
    } catch (error) {
      dispatch({
        type: "LOGIN_ERROR",
        payload: {
          error:
            error instanceof Error ? error.message : "Google login failed",
        },
      });
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch("/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } finally {
      dispatch({ type: "LOGOUT" });
    }
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: "CLEAR_ERROR" });
  }, []);

  const value: AuthContextType = {
    state,
    login,
    register,
    googleLogin,
    logout,
    clearError,
    isAuthenticated: state.status === "authenticated",
    isLoading: state.status === "loading",
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}
