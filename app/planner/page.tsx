"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function PlannerPage() {
  const router = useRouter();

  // Form Parameters
  const [origin, setOrigin] = useState("Delhi");
  const [destination, setDestination] = useState("Manali");
  const [budget, setBudget] = useState(55000);
  const [travelers, setTravelers] = useState(2);
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0]
  );
  const [transportMode, setTransportMode] = useState("flight");
  const [dietary, setDietary] = useState("vegetarian");
  const [pace, setPace] = useState("moderate");
  const [stayType, setStayType] = useState("hotel");

  // Interaction State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const quickDestinations = [
    { label: "Goa", emoji: "🌴" },
    { label: "Jaipur", emoji: "🏰" },
    { label: "Udaipur", emoji: "⛵" },
    { label: "Manali", emoji: "🏔️" },
    { label: "Ooty", emoji: "🌲" },
    { label: "Varanasi", emoji: "🛕" },
  ];

  const travelPaces = [
    { id: "relaxed", label: "Relaxed", desc: "Leisurely mornings, 2-3 spots/day" },
    { id: "moderate", label: "Balanced", desc: "Optimal mix of sites & cafe culture" },
    { id: "packed", label: "Fast-Paced", desc: "Maximize coverage & high activity" },
  ];

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      origin,
      destination,
      startDate,
      endDate,
      groupSize: Number(travelers),
      totalBudgetINR: Number(budget),
      transportMode,
      dietary,
      pace,
      stayType,
    };

    try {
      const res = await fetch("/api/generate-itinerary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || `Server returned status ${res.status}`);
        setLoading(false);
        return;
      }

      if (typeof window !== "undefined") {
        localStorage.setItem(`itinerary_${data.id}`, JSON.stringify(data));
      }

      router.push(`/itinerary/${data.id}`);
    } catch (err: any) {
      setError(err.message || "Failed to connect to server. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#2D2A26] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Navigation & Brand Bar */}
        <div className="flex items-center justify-between border-b border-[#EDE7DC] pb-4">
          <Link href="/" className="flex items-center gap-2 font-serif font-bold text-2xl text-[#1E1B18]">
            <span className="w-8 h-8 rounded-xl bg-[#E86A45] text-white flex items-center justify-center text-sm font-sans font-bold shadow-xs">
              M
            </span>
            Musafir<span className="text-[#E86A45]">AI</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-xs font-semibold text-[#8C827A] hover:text-[#E86A45] transition"
            >
              ← Back to Home
            </Link>
          </div>
        </div>

        {/* Main Form Container */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#EDE7DC] shadow-xs">
          
          {/* Header Banner */}
          <div className="mb-8">
            <span className="text-[11px] font-bold tracking-widest text-[#E86A45] uppercase">
              PLAN YOUR ADVENTURE
            </span>
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#1E1B18] mt-2 mb-2">
              Build your custom itinerary
            </h1>
            <p className="text-xs sm:text-sm text-[#7A7369]">
              Tailor your route, set your budget slider, and let AI curate your daily timeline.
            </p>
          </div>

          {/* Error Alert Box */}
          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm leading-relaxed flex items-start gap-2">
              <span className="font-bold text-red-800">Alert:</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleGenerate} className="space-y-8">
            
            {/* Destination Selection Section */}
            <div className="space-y-4">
              <label className="block text-[11px] font-bold text-[#8C827A] tracking-wider uppercase">
                SELECT OR ENTER DESTINATION
              </label>

              {/* Quick Chips */}
              <div className="flex flex-wrap gap-2">
                {quickDestinations.map((item) => (
                  <button
                    type="button"
                    key={item.label}
                    onClick={() => setDestination(item.label)}
                    className={`px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5 transition ${
                      destination.toLowerCase() === item.label.toLowerCase()
                        ? "bg-[#E86A45] text-white shadow-xs"
                        : "bg-[#F4EFE6] text-[#6A635B] hover:bg-[#EBE4D8]"
                    }`}
                  >
                    <span>{item.emoji}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>

              {/* Starting & Ending City Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#6A635B] mb-1.5">
                    Starting City
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3 text-sm text-[#8C827A]">🛫</span>
                    <input
                      type="text"
                      required
                      value={origin}
                      onChange={(e) => setOrigin(e.target.value)}
                      placeholder="e.g. Delhi"
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-[#E3DBD0] bg-[#FAF8F5] text-sm text-[#1E1B18] focus:bg-white focus:border-[#E86A45] focus:outline-hidden transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#6A635B] mb-1.5">
                    Destination City
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3 text-sm text-[#8C827A]">📍</span>
                    <input
                      type="text"
                      required
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      placeholder="e.g. Manali"
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-[#E3DBD0] bg-[#FAF8F5] text-sm text-[#1E1B18] focus:bg-white focus:border-[#E86A45] focus:outline-hidden transition"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Total Estimated Budget Box */}
            <div className="p-6 rounded-2xl bg-[#FAF8F5] border border-[#EDE7DC] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-[#8C827A] tracking-wider uppercase block">
                    TOTAL ESTIMATED BUDGET
                  </span>
                  <span className="text-xs text-[#7A7369]">Includes stays, local transit, food & sightseeing</span>
                </div>
                <span className="text-3xl font-serif font-bold text-[#E86A45]">
                  ₹{budget.toLocaleString("en-IN")}
                </span>
              </div>

              <input
                type="range"
                min="5000"
                max="150000"
                step="2500"
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="w-full accent-[#E86A45] cursor-pointer"
              />

              <div className="flex justify-between text-[11px] text-[#8C827A] font-medium">
                <span>₹5,000 (Backpacker)</span>
                <span>₹75,000 (Comfort)</span>
                <span>₹1,50,000 (Luxury)</span>
              </div>
            </div>

            {/* Travelers & Dates Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#6A635B] mb-1.5">
                  Travelers
                </label>
                <select
                  value={travelers}
                  onChange={(e) => setTravelers(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#E3DBD0] bg-[#FAF8F5] text-sm text-[#1E1B18] focus:bg-white focus:border-[#E86A45] focus:outline-hidden transition"
                >
                  <option value={1}>1 Solo Explorer</option>
                  <option value={2}>2 People (Duo)</option>
                  <option value={3}>3 People (Friends)</option>
                  <option value={4}>4 People (Family)</option>
                  <option value={5}>5+ Group Travel</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#6A635B] mb-1.5">
                  Start Date
                </label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#E3DBD0] bg-[#FAF8F5] text-sm text-[#1E1B18] focus:bg-white focus:border-[#E86A45] focus:outline-hidden transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#6A635B] mb-1.5">
                  End Date
                </label>
                <input
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#E3DBD0] bg-[#FAF8F5] text-sm text-[#1E1B18] focus:bg-white focus:border-[#E86A45] focus:outline-hidden transition"
                />
              </div>
            </div>

            {/* Preferences: Transit & Dietary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#6A635B] mb-1.5">
                  Primary Transport Mode
                </label>
                <select
                  value={transportMode}
                  onChange={(e) => setTransportMode(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#E3DBD0] bg-[#FAF8F5] text-sm text-[#1E1B18] focus:bg-white focus:border-[#E86A45] focus:outline-hidden transition"
                >
                  <option value="flight">Flight / Quick Connection</option>
                  <option value="train">Train / Express Route</option>
                  <option value="bus">Volvo / AC Semi-Sleeper</option>
                  <option value="drive">Self-Drive / Road Trip</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#6A635B] mb-1.5">
                  Dietary Preference
                </label>
                <select
                  value={dietary}
                  onChange={(e) => setDietary(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#E3DBD0] bg-[#FAF8F5] text-sm text-[#1E1B18] focus:bg-white focus:border-[#E86A45] focus:outline-hidden transition"
                >
                  <option value="vegetarian">Pure Vegetarian & Jain Friendly</option>
                  <option value="vegan">Vegan / Plant-Based</option>
                  <option value="local">Local Authentic (Mixed / Non-Veg)</option>
                </select>
              </div>
            </div>

            {/* Travel Pace Selector */}
            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-[#8C827A] tracking-wider uppercase">
                TRAVEL PACE & RHYTHM
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {travelPaces.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => setPace(p.id)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition ${
                      pace === p.id
                        ? "border-[#E86A45] bg-[#FAF3F0]"
                        : "border-[#EDE7DC] bg-[#FAF8F5] hover:bg-[#F4EFE6]"
                    }`}
                  >
                    <div className="font-bold text-xs text-[#1E1B18] mb-1">{p.label}</div>
                    <div className="text-[11px] text-[#7A7369] leading-tight">{p.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-6 rounded-2xl bg-[#E86A45] hover:bg-[#D95D39] text-white font-bold text-sm tracking-wide shadow-md transition-all duration-200 disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Curating authentic itinerary...
                  </>
                ) : (
                  "Generate Detailed Itinerary →"
                )}
              </button>
            </div>

          </form>
        </div>

        {/* Footer Notes */}
        <div className="text-center text-xs text-[#A89F95] space-y-1">
          <p>Verified routes, budget pacing, and AI recommendations crafted live.</p>
          <p>© {new Date().getFullYear()} MusafirAI. All rights reserved.</p>
        </div>

      </div>
    </div>
  );
}