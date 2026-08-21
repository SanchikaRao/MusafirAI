"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase"; // Adjust relative path if needed
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AuthPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  // 1. Google OAuth Sign-in
  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to initialize Google login.");
      setLoading(false);
    }
  };

  // 2. Email & Password Authentication
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;

        if (data.session) {
          router.push("/dashboard");
        } else {
          setSuccessMessage("Check your inbox to verify your email address!");
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;

        if (data.session) {
          router.push("/dashboard");
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Authentication failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#2D2A26] flex flex-col justify-center items-center px-4 py-12 antialiased">
      <div className="w-full max-w-md space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 justify-center">
            <div className="w-9 h-9 rounded-2xl bg-[#DE6B48] text-white flex items-center justify-center font-bold text-lg shadow-sm">
              ✦
            </div>
            <span className="font-serif font-bold text-2xl text-[#1E1B18] tracking-tight">
              MusafirAI
            </span>
          </Link>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1E1B18] pt-2">
            {isSignUp ? "Create your account" : "Welcome back"}
          </h2>
          <p className="text-xs sm:text-sm text-[#7A7166]">
            {isSignUp
              ? "Plan, curate, and explore personalized road trips."
              : "Access your saved trips and curated itineraries."}
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-white border border-[#EBE3D5] rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
          
          {/* Status Messages */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-[#FDF0EC] border border-[#F5D5CB] text-[#C95937] text-xs font-medium leading-relaxed">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-2xl bg-[#F0FDF4] border border-[#DCFCE7] text-[#15803D] text-xs font-medium leading-relaxed">
              {successMessage}
            </div>
          )}

          {/* Google Login Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-2xl border border-[#EBE3D5] bg-white text-xs sm:text-sm font-bold text-[#1E1B18] hover:bg-[#FAF8F5] transition shadow-2xs cursor-pointer disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-[#EBE3D5] w-full" />
            <span className="bg-white px-3 text-[11px] font-bold tracking-wider text-[#A89F91] uppercase absolute">
              or
            </span>
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#7A7166] mb-1.5">
                Email address
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-2xl border border-[#EBE3D5] bg-[#FAF8F5] text-xs sm:text-sm text-[#1E1B18] placeholder-[#A89F91] focus:outline-none focus:border-[#DE6B48] focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#7A7166] mb-1.5">
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-2.5 rounded-2xl border border-[#EBE3D5] bg-[#FAF8F5] text-xs sm:text-sm text-[#1E1B18] placeholder-[#A89F91] focus:outline-none focus:border-[#DE6B48] focus:bg-white transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-2xl bg-[#DE6B48] text-white text-xs sm:text-sm font-bold hover:bg-[#C95937] transition shadow-2xs cursor-pointer disabled:opacity-50"
            >
              {loading ? "Processing..." : isSignUp ? "Create Account" : "Sign In"}
            </button>
          </form>

          {/* Toggle between Sign In & Sign Up */}
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrorMessage("");
                setSuccessMessage("");
              }}
              className="text-xs font-semibold text-[#7A7166] hover:text-[#DE6B48] transition cursor-pointer"
            >
              {isSignUp ? (
                <>Already have an account? <span className="text-[#DE6B48] font-bold">Sign In</span></>
              ) : (
                <>Don't have an account? <span className="text-[#DE6B48] font-bold">Create one</span></>
              )}
            </button>
          </div>

        </div>

        {/* Back Link */}
        <div className="text-center">
          <Link href="/" className="text-xs font-semibold text-[#8C8275] hover:text-[#DE6B48] transition">
            ← Back to Home
          </Link>
        </div>

      </div>
    </div>
  );
}