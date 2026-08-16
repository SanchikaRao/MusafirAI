"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function PlannerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const popularDestinations = [
    { label: "Goa", icon: "🌴" },
    { label: "Jaipur", icon: "🏰" },
    { label: "Udaipur", icon: "⛵" },
    { label: "Manali", icon: "🏔️" },
    { label: "Ooty", icon: "🌲" },
    { label: "Varanasi", icon: "🛕" },
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
    <div className="min-h-screen bg-[#FAFAF8] text-[#1E293B] py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-3xl mx-auto">
        
        {/* Navigation & Header */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200">
          <Link href="/" className="flex items-center gap-2 font-serif text-2xl font-bold text-emerald-800">
            🧭 Musafir AI
          </Link>
          <span className="text-xs uppercase tracking-widest text-emerald-600 font-semibold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            AI Travel Studio
          </span>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-xl border border-gray-100 relative overflow-hidden">
          
          <div className="mb-8">
            <p className="text-xs font-bold uppercase tracking-wider text-rose-500 mb-1">
              Plan Your Adventure
            </p>
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-gray-900 leading-tight">
              Build your custom itinerary
            </h1>
            <p className="text-gray-500 mt-2 text-sm sm:text-base">
              Tailor your route, set your budget slider, and let AI curate your daily timeline.
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-700 text-sm">
              <span className="text-lg">⚠️</span>
              <div>
                <p className="font-semibold">Generation Failed</p>
                <p className="mt-0.5 text-xs text-rose-600">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleGenerate} className="space-y-8">
            
            {/* Quick Destination Selectors */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
                Select or Enter Destination
              </label>
              <div className="flex flex-wrap gap-2 mb-4">
                {popularDestinations.map((dest) => (
                  <button
                    key={dest.label}
                    type="button"
                    onClick={() => handleSelectPreset(dest.label)}
                    className={`px-4 py-2 rounded-2xl text-sm font-medium transition-all flex items-center gap-2 border ${
                      formData.destination.toLowerCase() === dest.label.toLowerCase()
                        ? "bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-200"
                        : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    <span>{dest.icon}</span>
                    <span>{dest.label}</span>
                  </button>
                ))}
              </div>

              {/* Origin & Destination Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Starting City</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3.5 text-sm">🛫</span>
                    <input
                      type="text"
                      required
                      value={formData.origin}
                      onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                      placeholder="e.g. Delhi, Mumbai"
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:bg-white transition text-sm font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Destination City</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3.5 text-sm">📍</span>
                    <input
                      type="text"
                      required
                      value={formData.destination}
                      onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                      placeholder="e.g. Jaipur, Goa"
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:bg-white transition text-sm font-medium"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Budget Slider */}
            <div className="p-6 bg-amber-50/50 rounded-2xl border border-amber-100">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
                  Total Estimated Budget
                </span>
                <span className="text-2xl font-bold font-serif text-rose-600">
                  ₹{Number(formData.totalBudgetINR).toLocaleString("en-IN")}
                </span>
              </div>
              <input
                type="range"
                min="5000"
                max="150000"
                step="2000"
                value={formData.totalBudgetINR}
                onChange={(e) => setFormData({ ...formData, totalBudgetINR: Number(e.target.value) })}
                className="w-full h-2 bg-amber-200 rounded-lg appearance-none cursor-pointer accent-rose-500"
              />
              <div className="flex justify-between text-xs text-amber-800/70 mt-2 font-medium">
                <span>₹5,000 (Backpacker)</span>
                <span>₹75,000 (Comfort)</span>
                <span>₹1,50,000 (Luxury)</span>
              </div>
            </div>

            {/* Dates & Group Size */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Start Date</label>
                <input
                  type="date"
                  required
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:bg-white transition text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">End Date</label>
                <input
                  type="date"
                  required
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:bg-white transition text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Travelers</label>
                <select
                  value={formData.groupSize}
                  onChange={(e) => setFormData({ ...formData, groupSize: Number(e.target.value) })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:bg-white transition text-sm font-medium"
                >
                  <option value={1}>Solo (1 Person)</option>
                  <option value={2}>Couple (2 People)</option>
                  <option value={4}>Small Group (4 People)</option>
                  <option value={6}>Family / Group (6+)</option>
                </select>
              </div>
            </div>

            {/* Transport & Dietary Preferences */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Preferred Transit</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: "flight", icon: "✈️", label: "Air" },
                    { id: "train", icon: "🚆", label: "Rail" },
                    { id: "bus", icon: "🚌", label: "Bus" },
                    { id: "cab", icon: "🚗", label: "Cab" },
                  ].map((mode) => {
                    const isSelected = formData.transportMode === mode.id;
                    return (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, transportMode: mode.id })}
                        className={`py-3 rounded-2xl border text-xs font-semibold flex flex-col items-center gap-1 transition ${
                          isSelected
                            ? "border-emerald-600 bg-emerald-50 text-emerald-800 shadow-sm"
                            : "border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        <span className="text-base">{mode.icon}</span>
                        {mode.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Dietary Preference</label>
                <select
                  value={formData.dietary}
                  onChange={(e) => setFormData({ ...formData, dietary: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:bg-white transition text-sm font-medium"
                >
                  <option value="vegetarian">Pure Vegetarian</option>
                  <option value="non-vegetarian">Non-Vegetarian</option>
                  <option value="vegan">Vegan</option>
                  <option value="jain">Jain Friendly</option>
                </select>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 px-6 rounded-2xl font-bold text-white text-base shadow-lg transition-all flex items-center justify-center gap-3 ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-emerald-700 hover:bg-emerald-800 shadow-emerald-200 active:scale-[0.99]"
              }`}
            >
              {loading ? (
                <span>✨ Curating Real-Time Itinerary...</span>
              ) : (
                <span>✨ Generate Detailed Itinerary →</span>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-8">
          Powered by Next.js Serverless Functions & Google Gemini 2.5 Flash
        </p>
      </div>
    </div>
  );
}