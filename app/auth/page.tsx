"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import Link from "next/link";

export default function AuthPage() {
  const router = useRouter();
  const [authMode, setAuthMode] = useState<"login" | "signup" | "phone">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("+91");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "error" | "success" } | null>(null);

  // 1. Google OAuth
  const handleGoogleLogin = async () => {
    setLoading(true);
    setMessage(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
    if (error) {
      setMessage({ text: error.message, type: "error" });
      setLoading(false);
    }
  };

  // 2. Email & Password (Sign In / Register)
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (authMode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        setMessage({ text: error.message, type: "error" });
      } else {
        setMessage({
          text: "Verification link sent! Check your email to confirm your account.",
          type: "success",
        });
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setMessage({ text: error.message, type: "error" });
      } else {
        router.push("/dashboard");
      }
    }
    setLoading(false);
  };

  // 3. Phone OTP Verification
  const handleSendPhoneOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.signInWithOtp({
      phone,
    });

    if (error) {
      setMessage({ text: error.message, type: "error" });
    } else {
      setOtpSent(true);
      setMessage({ text: `6-digit verification code sent to ${phone}`, type: "success" });
    }
    setLoading(false);
  };

  const handleVerifyPhoneOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.verifyOtp({
      phone,
      token: otp,
      type: "sms",
    });

    if (error) {
      setMessage({ text: error.message, type: "error" });
    } else {
      router.push("/dashboard");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col justify-center items-center py-12 px-4 sm:px-6 selection:bg-[#E86A45] selection:text-white">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-[#EDE7DC] shadow-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E86A45] text-white flex items-center justify-center font-serif text-lg font-bold shadow-md shadow-[#E86A45]/20">
              ✦
            </div>
            <span className="font-serif font-bold text-2xl text-[#1E1B18]">MusafirAI</span>
          </Link>
          <h2 className="text-xl font-serif font-bold text-[#1E1B18]">
            {authMode === "login"
              ? "Welcome back"
              : authMode === "signup"
              ? "Create an account"
              : "Phone Verification"}
          </h2>
          <p className="text-xs text-[#7A7166] mt-1">
            Access your trip history and upcoming travel plans.
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="flex bg-[#FAF7F2] p-1 rounded-2xl border border-[#EDE7DC] mb-6">
          <button
            type="button"
            onClick={() => {
              setAuthMode("login");
              setMessage(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
              authMode === "login" ? "bg-white text-[#1E1B18] shadow-xs" : "text-[#8C8275]"
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode("signup");
              setMessage(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
              authMode === "signup" ? "bg-white text-[#1E1B18] shadow-xs" : "text-[#8C8275]"
            }`}
          >
            Register
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode("phone");
              setMessage(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
              authMode === "phone" ? "bg-white text-[#1E1B18] shadow-xs" : "text-[#8C8275]"
            }`}
          >
            Phone OTP
          </button>
        </div>

        {message && (
          <div
            className={`mb-5 p-3.5 rounded-2xl text-xs font-bold border ${
              message.type === "error"
                ? "bg-[#FDEEED] border-[#F8D2CF] text-[#C53929]"
                : "bg-[#EDF7ED] border-[#C8E6C9] text-[#2E7D32]"
            }`}
          >
            {message.text}
          </div>
        )}

        {authMode !== "phone" && (
          <div className="space-y-4">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full py-3 px-4 rounded-2xl border border-[#E3DBD0] hover:bg-[#FAF7F2] font-bold text-xs text-[#1E1B18] flex items-center justify-center gap-2.5 transition shadow-2xs cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              Continue with Google
            </button>

            <div className="flex items-center my-4">
              <div className="flex-1 border-t border-[#EDE7DC]" />
              <span className="px-3 text-[11px] font-bold text-[#A69E92] uppercase">Or email</span>
              <div className="flex-1 border-t border-[#EDE7DC]" />
            </div>

            <form onSubmit={handleEmailAuth} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-[#7A7166] uppercase mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-4 py-3 rounded-2xl border border-[#E3DBD0] focus:border-[#E86A45] focus:outline-none text-sm text-[#1E1B18]"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#7A7166] uppercase mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                  className="w-full px-4 py-3 rounded-2xl border border-[#E3DBD0] focus:border-[#E86A45] focus:outline-none text-sm text-[#1E1B18]"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-2xl bg-[#E86A45] hover:bg-[#D95D39] text-white font-bold text-xs shadow-md shadow-[#E86A45]/20 transition cursor-pointer"
              >
                {loading ? "Processing..." : authMode === "login" ? "Sign In" : "Register with Email"}
              </button>
            </form>
          </div>
        )}

        {authMode === "phone" && (
          <div className="space-y-4">
            {!otpSent ? (
              <form onSubmit={handleSendPhoneOTP} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-[#7A7166] uppercase mb-1">
                    Phone Number (with Country Code)
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+919876543210"
                    className="w-full px-4 py-3 rounded-2xl border border-[#E3DBD0] focus:border-[#E86A45] focus:outline-none text-sm text-[#1E1B18]"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-2xl bg-[#E86A45] hover:bg-[#D95D39] text-white font-bold text-xs shadow-md shadow-[#E86A45]/20 transition cursor-pointer"
                >
                  {loading ? "Sending Code..." : "Send Verification OTP"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyPhoneOTP} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-[#7A7166] uppercase mb-1">
                    Enter 6-Digit OTP
                  </label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="123456"
                    maxLength={6}
                    className="w-full px-4 py-3 rounded-2xl border border-[#E3DBD0] focus:border-[#E86A45] focus:outline-none text-center font-mono tracking-widest text-lg text-[#1E1B18]"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-2xl bg-[#E86A45] hover:bg-[#D95D39] text-white font-bold text-xs shadow-md shadow-[#E86A45]/20 transition cursor-pointer"
                >
                  {loading ? "Verifying..." : "Verify & Sign In"}
                </button>
                <button
                  type="button"
                  onClick={() => setOtpSent(false)}
                  className="w-full text-center text-xs font-semibold text-[#8C8275] underline"
                >
                  Change Phone Number
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}