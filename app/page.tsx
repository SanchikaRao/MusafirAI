"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import type { User } from "@supabase/supabase-js";

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setAuthLoading(false);
    };

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.refresh();
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-white">
      {/* Top Navbar with Synced Auth State */}
      <header className="w-full max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-serif text-base font-bold">
            ✦
          </div>
          <span className="font-serif font-bold text-xl tracking-tight text-white">
            MusafirAI
          </span>
        </Link>

        <div className="flex items-center gap-3">
          {!authLoading && user ? (
            <>
              <Link
                href="/dashboard"
                className="text-xs sm:text-sm font-semibold text-slate-300 hover:text-amber-400 transition"
              >
                My Trips
              </Link>
              <span className="text-xs text-slate-400 hidden sm:inline">
                👤 {user.email}
              </span>
              <button
                type="button"
                onClick={handleSignOut}
                className="text-xs font-bold text-slate-950 bg-amber-400 px-3.5 py-1.5 rounded-full hover:bg-amber-300 transition cursor-pointer"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/auth"
                className="text-xs sm:text-sm font-semibold text-slate-300 hover:text-amber-400 transition"
              >
                My Trips
              </Link>
              <Link
                href="/auth"
                className="text-xs font-bold text-amber-400 border border-amber-400/40 bg-slate-900 px-3.5 py-1.5 rounded-full hover:bg-slate-800 transition"
              >
                Account / Login
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Dark Hero Screen */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-4xl md:text-6xl font-black mb-4">
          AI Indian Trip <span className="text-amber-400">Planner</span>
        </h1>
        <p className="text-slate-400 max-w-md mb-8 text-lg">
          Custom itineraries tailored to INR budgets, train/cab routes, and dietary preferences.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/planner"
            className="bg-amber-400 text-slate-950 font-bold px-8 py-4 rounded-xl text-lg hover:bg-amber-500 transition-all"
          >
            Start Planning Your Trip →
          </Link>
          {!authLoading && user && (
            <Link
              href="/dashboard"
              className="border border-slate-700 bg-slate-900 text-white font-bold px-6 py-4 rounded-xl text-lg hover:bg-slate-800 transition-all"
            >
              View Saved Journeys
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}