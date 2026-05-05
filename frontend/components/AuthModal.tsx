"use client";

import { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { useAuth } from "@/hooks/useAuth";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
}

interface PasswordRequirements {
  minLength: boolean;
  uppercase: boolean;
  digit: boolean;
  special: boolean;
}

const PASSWORD_REQUIREMENTS = {
  minLength: /^.{8,}$/,
  uppercase: /[A-Z]/,
  digit: /\d/,
  special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
};

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { login, register, clearError, state, isLoading } = useAuth();
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [formError, setFormError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
  });

  useEffect(() => {
    if (!isOpen) {
      clearError();
      setFormError(null);
      setFormData({
        email: "",
        password: "",
        confirmPassword: "",
        name: "",
      });
    }
  }, [isOpen, clearError]);

  const passwordReqs: PasswordRequirements = {
    minLength: PASSWORD_REQUIREMENTS.minLength.test(formData.password),
    uppercase: PASSWORD_REQUIREMENTS.uppercase.test(formData.password),
    digit: PASSWORD_REQUIREMENTS.digit.test(formData.password),
    special: PASSWORD_REQUIREMENTS.special.test(formData.password),
  };

  const isPasswordValid = Object.values(passwordReqs).every(Boolean);
  const passwordsMatch = formData.password === formData.confirmPassword;
  const isSignUpFormValid =
    formData.email &&
    formData.password &&
    isPasswordValid &&
    passwordsMatch &&
    formData.name;
  const isSignInFormValid = formData.email && formData.password;

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setFormError(null);
  };

  const handleEmailLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);

    if (!isSignInFormValid) {
      setFormError("Please fill in all fields");
      return;
    }

    try {
      await login(formData.email, formData.password);
      setFormData({ email: "", password: "", confirmPassword: "", name: "" });
      onClose();
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Login failed. Please try again."
      );
    }
  };

  const handleRegister = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);

    if (!isSignUpFormValid) {
      if (!formData.email) setFormError("Email is required");
      else if (!formData.name) setFormError("Name is required");
      else if (!formData.password) setFormError("Password is required");
      else if (!isPasswordValid)
        setFormError(
          "Password must be at least 8 characters with uppercase, digit, and special character"
        );
      else if (!passwordsMatch) setFormError("Passwords do not match");
      return;
    }

    try {
      await register(formData.email, formData.password, formData.name);
      setFormData({ email: "", password: "", confirmPassword: "", name: "" });
      setTab("signin");
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Registration failed. Please try again."
      );
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const authUrl = `${baseUrl}/auth/google/authorize?redirect_uri=${encodeURIComponent(
        `${window.location.origin}/auth/callback`
      )}`;

      const popup = window.open(authUrl, "google-auth", "width=500,height=600");

      const handleMessage = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        if (event.data.type === "GOOGLE_AUTH_SUCCESS") {
          popup?.close();
          window.removeEventListener("message", handleMessage);
          window.location.reload();
        } else if (event.data.type === "GOOGLE_AUTH_ERROR") {
          popup?.close();
          window.removeEventListener("message", handleMessage);
          setGoogleLoading(false);
        }
      };

      window.addEventListener("message", handleMessage);
    } catch (error) {
      setGoogleLoading(false);
      console.error("Google sign-in error:", error);
    }
  };

  const displayError = formError || state.error;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">PreLegal</h2>

        {/* Tab Switcher */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => {
              setTab("signin");
              setFormError(null);
              clearError();
            }}
            className={`flex-1 py-2 px-4 font-medium text-sm transition-colors ${
              tab === "signin"
                ? "text-blue-600 border-b-2 border-blue-600 -mb-px"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => {
              setTab("signup");
              setFormError(null);
              clearError();
            }}
            className={`flex-1 py-2 px-4 font-medium text-sm transition-colors ${
              tab === "signup"
                ? "text-blue-600 border-b-2 border-blue-600 -mb-px"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error Display */}
        {displayError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
            {displayError}
          </div>
        )}

        {/* Sign In Tab */}
        {tab === "signin" && (
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label
                htmlFor="signin-email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email
              </label>
              <input
                id="signin-email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="you@example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="signin-password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Password
              </label>
              <input
                id="signin-password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="••••••••"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 rounded-md transition-colors"
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading || isLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-900 font-medium"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              {googleLoading ? "Signing in..." : "Continue with Google"}
            </button>

            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors text-sm"
            >
              Close
            </button>
          </form>
        )}

        {/* Sign Up Tab */}
        {tab === "signup" && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label
                htmlFor="signup-name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Full Name
              </label>
              <input
                id="signup-name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="John Doe"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="signup-email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email
              </label>
              <input
                id="signup-email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="you@example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="signup-password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Password
              </label>
              <input
                id="signup-password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="••••••••"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              {formData.password && (
                <div className="mt-2 space-y-1 text-xs">
                  <div
                    className={`flex items-center ${
                      passwordReqs.minLength ? "text-green-600" : "text-gray-500"
                    }`}
                  >
                    <span className="mr-1">
                      {passwordReqs.minLength ? "✓" : "○"}
                    </span>
                    At least 8 characters
                  </div>
                  <div
                    className={`flex items-center ${
                      passwordReqs.uppercase ? "text-green-600" : "text-gray-500"
                    }`}
                  >
                    <span className="mr-1">
                      {passwordReqs.uppercase ? "✓" : "○"}
                    </span>
                    One uppercase letter
                  </div>
                  <div
                    className={`flex items-center ${
                      passwordReqs.digit ? "text-green-600" : "text-gray-500"
                    }`}
                  >
                    <span className="mr-1">{passwordReqs.digit ? "✓" : "○"}</span>
                    One number
                  </div>
                  <div
                    className={`flex items-center ${
                      passwordReqs.special ? "text-green-600" : "text-gray-500"
                    }`}
                  >
                    <span className="mr-1">
                      {passwordReqs.special ? "✓" : "○"}
                    </span>
                    One special character (!@#$%^&*...)
                  </div>
                </div>
              )}
            </div>

            <div>
              <label
                htmlFor="signup-confirm"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Confirm Password
              </label>
              <input
                id="signup-confirm"
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="••••••••"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                  formData.confirmPassword && !passwordsMatch
                    ? "border-red-300 focus:ring-red-500"
                    : "border-gray-300 focus:ring-blue-500"
                }`}
              />
              {formData.confirmPassword && !passwordsMatch && (
                <p className="mt-1 text-xs text-red-600">Passwords do not match</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || !isSignUpFormValid}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 rounded-md transition-colors"
            >
              {isLoading ? "Creating account..." : "Create Account"}
            </button>

            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors text-sm"
            >
              Close
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
