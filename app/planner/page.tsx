"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Compass,
  MapPin,
  Calendar,
  Users,
  Sparkles,
  ArrowRight,
  AlertCircle,
  Plane,
  Train,
  Bus,
  Car,
  Utensils,
  Wallet,
  ShieldCheck,
  Zap,
  Info,
} from "lucide-react";

export default function PlannerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const popularDestinations = [
    { label: "Goa", icon: "🌴", state: "Coastal Paradise" },
    { label: "Jaipur", icon: "🏰", state: "Heritage & Royalty" },
    { label: "Udaipur", icon: "⛵", state: "City of Lakes" },
    { label: "Manali", icon: "🏔️", state: "Himalayan Escape" },
    { label: "Ooty", icon: "🌲", state: "Nilgiri Hills" },
    { label: "Varanasi", icon: "🛕", state: "Spiritual Ghats" },
  ];

  const [formData, setFormData] = useState({
    origin: "Ghaziabad",
    destination: "Jaipur",
    startDate: "2026-09-01",
    endDate: "2026-09-04",
    groupSize: 2,
    totalBudgetINR: 39000,
    transportMode: "train",
    dietary: "vegetarian",
  });

  const handleSelectPreset = (dest: string) => {
    setFormData((prev) => ({ ...prev, destination: dest }));
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/generate-itinerary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate itinerary. Please try again.");
      }

      localStorage.setItem("current_itinerary", JSON.stringify(data));

      const tripId = data.id || "latest";
      router.push(`/itinerary/${tripId}`);
    } catch (err: any) {
      console.error("Submission Error:", err);
      setError(err.message || "Failed to fetch itinerary. Check your connection or API keys.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1E293B] py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      <div className="max-w-4xl mx-auto">
        
        {/* Navigation & Header */}
        <header className="flex items-center justify-between mb-10 pb-6 border-b border-stone-200/80">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-2xl bg-emerald-700 flex items-center justify-center text-white shadow-md shadow-emerald-700/20 group-hover:scale-105 transition-transform">
              <Compass className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <span className="font-serif text-2xl font-bold tracking-tight text-stone-900 block leading-tight">
                Musafir AI
              </span>
              <span className="text-[11px] font-semibold tracking-wider uppercase text-emerald-700">
                Verified Smart Itineraries
              </span>
            </div>
          </Link>

          <div className="hidden sm:flex items-center gap-3">
            <span className="text-xs font-semibold text-stone-600 bg-stone-100 px-3 py-1.5 rounded-full border border-stone-200 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              Gemini 2.5 Flash Engine
            </span>
          </div>
        </header>

        {/* Main Card Container */}
        <main className="bg-white rounded-3xl p-8 sm:p-12 shadow-[0_4px_30px_rgba(0,0,0,0.04)] border border-stone-200/70 relative overflow-hidden">
          
          <div className="mb-10 text-center sm:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200/60 text-rose-600 text-xs font-bold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              Plan Your Next Journey
            </div>
            <h1 className="text-3xl sm:text-5xl font-serif font-bold text-stone-900 leading-tight">
              Build your custom itinerary
            </h1>
            <p className="text-stone-500 mt-3 text-base sm:text-lg max-w-2xl leading-relaxed">
              Tailor your route, set your budget slider, and let AI curate your daily verified timeline.
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-8 p-4 rounded-2xl bg-rose-50/90 border border-rose-200 flex items-start gap-3.5 text-rose-800 text-sm animate-shake">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-600" />
              <div>
                <p className="font-semibold">Unable to Generate Itinerary</p>
                <p className="mt-0.5 text-xs text-rose-700/90 leading-normal">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleGenerate} className="space-y-8">
            
            {/* Quick Destination Selectors */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-500">
                  Select Popular Destination
                </label>
                <span className="text-xs text-stone-400">Click to auto-fill</span>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                {popularDestinations.map((dest) => {
                  const isSelected = formData.destination.toLowerCase() === dest.label.toLowerCase();
                  return (
                    <button
                      key={dest.label}
                      type="button"
                      onClick={() => handleSelectPreset(dest.label)}
                      className={`p-3 rounded-2xl border text-left transition-all duration-200 ${
                        isSelected
                          ? "bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-500/20 scale-[1.02]"
                          : "bg-stone-50/80 text-stone-700 border-stone-200 hover:bg-stone-100/80 hover:border-stone-300"
                      }`}
                    >
                      <span className="text-xl block mb-1">{dest.icon}</span>
                      <span className="font-semibold text-sm block leading-tight">{dest.label}</span>
                      <span className={`text-[10px] block mt-0.5 ${isSelected ? "text-rose-100" : "text-stone-400"}`}>
                        {dest.state}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Origin & Destination Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-stone-700">Starting City</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <MapPin className="w-4 h-4 text-stone-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.origin}
                    onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                    placeholder="e.g. Delhi, Mumbai, Bengaluru"
                    className="w-full pl-10 pr-4 py-3.5 bg-stone-50 border border-stone-200 rounded-2xl focus:ring-2 focus:ring-emerald-600 focus:bg-white focus:outline-none transition text-sm font-medium text-stone-800"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-stone-700">Destination City</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <MapPin className="w-4 h-4 text-rose-500" />
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.destination}
                    onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                    placeholder="e.g. Jaipur, Goa, Leh"
                    className="w-full pl-10 pr-4 py-3.5 bg-stone-50 border border-stone-200 rounded-2xl focus:ring-2 focus:ring-emerald-600 focus:bg-white focus:outline-none transition text-sm font-medium text-stone-800"
                  />
                </div>
              </div>
            </div>

            {/* Budget Slider Card */}
            <div className="p-6 sm:p-7 bg-[#FFFDF9] rounded-3xl border border-amber-200/70 shadow-sm relative">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-amber-700" />
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-950">
                    Total Estimated Budget
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-serif font-bold text-rose-600">
                  ₹{Number(formData.totalBudgetINR).toLocaleString("en-IN")}
                </div>
              </div>

              <input
                type="range"
                min="5000"
                max="150000"
                step="2000"
                value={formData.totalBudgetINR}
                onChange={(e) => setFormData({ ...formData, totalBudgetINR: Number(e.target.value) })}
                className="w-full h-2.5 bg-amber-200/80 rounded-lg appearance-none cursor-pointer accent-rose-500 transition-all"
              />

              <div className="flex justify-between text-xs text-amber-900/60 mt-3 font-semibold">
                <span>₹5,000 (Backpacker)</span>
                <span>₹75,000 (Comfort)</span>
                <span>₹1,50,000 (Luxury)</span>
              </div>
            </div>

            {/* Dates & Group Size Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-stone-700">Start Date</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Calendar className="w-4 h-4 text-stone-400" />
                  </div>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl focus:ring-2 focus:ring-emerald-600 focus:bg-white focus:outline-none transition text-sm text-stone-800"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-stone-700">End Date</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Calendar className="w-4 h-4 text-stone-400" />
                  </div>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl focus:ring-2 focus:ring-emerald-600 focus:bg-white focus:outline-none transition text-sm text-stone-800"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-stone-700">Travelers</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Users className="w-4 h-4 text-stone-400" />
                  </div>
                  <select
                    value={formData.groupSize}
                    onChange={(e) => setFormData({ ...formData, groupSize: Number(e.target.value) })}
                    className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl focus:ring-2 focus:ring-emerald-600 focus:bg-white focus:outline-none transition text-sm font-medium text-stone-800 appearance-none cursor-pointer"
                  >
                    <option value={1}>Solo (1 Person)</option>
                    <option value={2}>Couple (2 People)</option>
                    <option value={4}>Small Group (4 People)</option>
                    <option value={6}>Family / Group (6+)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Transport & Dietary Preferences */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-stone-700">Preferred Transit</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: "flight", icon: Plane, label: "Air" },
                    { id: "train", icon: Train, label: "Rail" },
                    { id: "bus", icon: Bus, label: "Bus" },
                    { id: "cab", icon: Car, label: "Cab" },
                  ].map((mode) => {
                    const Icon = mode.icon;
                    const isSelected = formData.transportMode === mode.id;
                    return (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, transportMode: mode.id })}
                        className={`py-3 rounded-2xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all ${
                          isSelected
                            ? "border-emerald-600 bg-emerald-50 text-emerald-800 shadow-sm"
                            : "border-stone-200 bg-stone-50/80 text-stone-600 hover:bg-stone-100"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{mode.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-stone-700">Dietary Preference</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Utensils className="w-4 h-4 text-stone-400" />
                  </div>
                  <select
                    value={formData.dietary}
                    onChange={(e) => setFormData({ ...formData, dietary: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl focus:ring-2 focus:ring-emerald-600 focus:bg-white focus:outline-none transition text-sm font-medium text-stone-800 appearance-none cursor-pointer"
                  >
                    <option value="vegetarian">Pure Vegetarian</option>
                    <option value="non-vegetarian">Non-Vegetarian</option>
                    <option value="vegan">Vegan</option>
                    <option value="jain">Jain Friendly</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Submit CTA */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-4 px-6 rounded-2xl font-bold text-white text-base shadow-xl transition-all duration-300 flex items-center justify-center gap-3 ${
                  loading
                    ? "bg-stone-400 cursor-not-allowed"
                    : "bg-emerald-700 hover:bg-emerald-800 shadow-emerald-700/25 active:scale-[0.99]"
                }`}
              >
                {loading ? (
                  <>
                    <Sparkles className="w-5 h-5 animate-spin" />
                    <span>Curating Real-Time Itinerary...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 text-amber-300" />
                    <span>Generate Detailed Itinerary</span>
                    <ArrowRight className="w-5 h-5 ml-1 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </form>
        </main>

        {/* Feature Badges Footer */}
        <footer className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center sm:text-left">
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/60 border border-stone-200/50">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 flex-shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-stone-800">Verified Routes</p>
              <p className="text-[11px] text-stone-500">Real travel times & NH connections</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/60 border border-stone-200/50">
            <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 flex-shrink-0">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-stone-800">Dynamic Budgets</p>
              <p className="text-[11px] text-stone-500">Realistic split for stay & transit</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/60 border border-stone-200/50">
            <div className="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center text-rose-700 flex-shrink-0">
              <Info className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-stone-800">Instant Export</p>
              <p className="text-[11px] text-stone-500">Save to Supabase or view offline</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}