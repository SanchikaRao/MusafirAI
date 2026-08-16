"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import Link from "next/link";

interface TripFormData {
  origin: string;
  destination: string;
  startDate: string;
  endDate: string;
  groupSize: number;
  totalBudgetINR: number;
  transportMode: string;
  dietary: string;
}

const DESTINATION_CHIPS = [
  { name: "Goa", emoji: "🌴", origin: "Delhi", defaultBudget: 35000 },
  { name: "Jaipur", emoji: "🏰", origin: "Delhi", defaultBudget: 22000 },
  { name: "Udaipur", emoji: "⛵", origin: "Mumbai", defaultBudget: 28000 },
  { name: "Manali", emoji: "🏔️", origin: "Delhi", defaultBudget: 25000 },
  { name: "Ooty", emoji: "🌲", origin: "Bengaluru", defaultBudget: 20000 },
  { name: "Varanasi", emoji: "🛕", origin: "Delhi", defaultBudget: 18000 },
];

export default function PlannerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const [formData, setFormData] = useState<TripFormData>({
    origin: "",
    destination: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0],
    groupSize: 2,
    totalBudgetINR: 35000,
    transportMode: "flight",
    dietary: "vegetarian",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "groupSize" || name === "totalBudgetINR" ? Number(value) : value,
    }));
  };

  const handleSelectChip = (chip: typeof DESTINATION_CHIPS[0]) => {
    setFormData((prev) => ({
      ...prev,
      destination: chip.name,
      origin: chip.origin,
      totalBudgetINR: chip.defaultBudget,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.origin.trim() || !formData.destination.trim()) {
      setErrorMessage("Please enter both starting location and destination.");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/generate-itinerary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const itineraryData = await response.json();
      localStorage.setItem("current_itinerary", JSON.stringify(itineraryData));

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          await supabase.from("trips").insert({
            user_id: user.id,
            trip_title: itineraryData.tripTitle || `${formData.destination} Getaway`,
            origin: formData.origin,
            destination: formData.destination,
            start_date: formData.startDate,
            end_date: formData.endDate,
            group_size: formData.groupSize,
            total_budget_inr: formData.totalBudgetINR,
            transport_mode: formData.transportMode,
            dietary: formData.dietary,
            status: "upcoming",
            itinerary_data: itineraryData,
          });
        }
      } catch (authErr) {
        console.warn("Could not save to Supabase:", authErr);
      }

      router.push(`/itinerary/${itineraryData.id}`);
    } catch (err: any) {
      setLoading(false);
      setErrorMessage(err.message || "Failed to generate itinerary. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#2D2A26] py-10 px-4 sm:px-6 flex flex-col justify-between">
      <div className="max-w-3xl mx-auto w-full flex items-center justify-between mb-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-2xl bg-[#E86A45] text-white flex items-center justify-center font-serif text-base font-bold shadow-md shadow-[#E86A45]/20">
            ✦
          </div>
          <span className="font-serif font-bold text-xl text-[#1E1B18]">MusafirAI</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="text-xs font-semibold text-[#7A7166] hover:text-[#1E1B18] transition"
          >
            My Trips
          </Link>
          <Link
            href="/auth"
            className="text-xs font-bold text-[#E86A45] bg-white px-3.5 py-1.5 rounded-full border border-[#EDE7DC] shadow-2xs hover:bg-[#FAF7F2] transition"
          >
            Account / Login
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto w-full bg-white rounded-3xl p-6 sm:p-10 border border-[#EDE7DC] shadow-sm">
        <div className="mb-8">
          <span className="text-[11px] font-bold tracking-widest text-[#E86A45] uppercase">
            PLAN YOUR ADVENTURE
          </span>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#1E1B18] mt-1">
            Build your custom itinerary
          </h1>
          <p className="text-xs sm:text-sm text-[#7A7166] mt-1.5 font-medium">
            Tailor your route, set your budget slider, and let AI curate your daily timeline.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-[#FDEEED] border border-[#F8D2CF] text-[#C53929] text-xs font-bold">
            {errorMessage}
          </div>
        )}

        {loading ? (
          <div className="py-16 text-center space-y-4">
            <div className="w-12 h-12 border-4 border-[#E86A45] border-t-transparent rounded-full animate-spin mx-auto" />
            <h3 className="font-serif font-bold text-xl text-[#1E1B18]">
              Generating itinerary for {formData.destination || "your trip"}...
            </h3>
            <p className="text-xs text-[#7A7166] max-w-sm mx-auto">
              Calculating daily pacing, finding top stays, and balancing your ₹{formData.totalBudgetINR.toLocaleString("en-IN")} budget.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-3">
              <label className="block text-xs font-bold text-[#7A7166] uppercase tracking-wider">
                Select or Enter Destination
              </label>

              <div className="flex flex-wrap gap-2 pt-1 pb-2">
                {DESTINATION_CHIPS.map((chip) => {
                  const isSelected = formData.destination.toLowerCase() === chip.name.toLowerCase();
                  return (
                    <button
                      key={chip.name}
                      type="button"
                      onClick={() => handleSelectChip(chip)}
                      className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        isSelected
                          ? "bg-[#E86A45] text-white shadow-md shadow-[#E86A45]/20 scale-102"
                          : "bg-[#FAF7F2] hover:bg-[#F2ECE1] border border-[#E3DBD0] text-[#4A443E]"
                      }`}
                    >
                      <span>{chip.emoji}</span>
                      <span>{chip.name}</span>
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-[#8C8275] mb-1">
                    Starting City
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3 text-sm">🛫</span>
                    <input
                      type="text"
                      name="origin"
                      value={formData.origin}
                      onChange={handleChange}
                      placeholder="e.g. Mumbai, Delhi, Bengaluru..."
                      className="w-full pl-10 pr-4 py-3 rounded-2xl border border-[#E3DBD0] focus:border-[#E86A45] focus:outline-none text-sm font-medium text-[#1E1B18] placeholder:text-slate-400/60 bg-transparent"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#8C8275] mb-1">
                    Destination City
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3 text-sm">📍</span>
                    <input
                      type="text"
                      name="destination"
                      value={formData.destination}
                      onChange={handleChange}
                      placeholder="e.g. Goa, Jaipur, Manali..."
                      className="w-full pl-10 pr-4 py-3 rounded-2xl border border-[#E3DBD0] focus:border-[#E86A45] focus:outline-none text-sm font-medium text-[#1E1B18] placeholder:text-slate-400/60 bg-transparent"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            <hr className="border-[#EDE7DC]" />

            <div className="space-y-6">
              <div className="bg-[#FAF7F2]/60 border border-[#EDE7DC] rounded-2xl p-5 space-y-3">
                <div className="flex justify-between items-baseline">
                  <label className="text-xs font-bold text-[#7A7166] uppercase tracking-wider">
                    Total Estimated Budget
                  </label>
                  <span className="font-serif font-extrabold text-2xl text-[#E86A45]">
                    ₹{formData.totalBudgetINR.toLocaleString("en-IN")}
                  </span>
                </div>

                <input
                  type="range"
                  name="totalBudgetINR"
                  min={5000}
                  max={150000}
                  step={2000}
                  value={formData.totalBudgetINR}
                  onChange={handleChange}
                  className="w-full h-2 bg-[#E3DBD0] rounded-lg appearance-none cursor-pointer accent-[#E86A45]"
                />

                <div className="flex justify-between text-[11px] font-semibold text-[#8C8275]">
                  <span>₹5,000 (Backpacker)</span>
                  <span>₹75,000 (Comfort)</span>
                  <span>₹1,50,000 (Luxury)</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-[#FAF7F2]/60 border border-[#EDE7DC] rounded-2xl p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-[#7A7166] uppercase tracking-wider">
                      Travelers
                    </label>
                    <span className="font-bold text-sm text-[#1E1B18]">
                      👥 {formData.groupSize} {formData.groupSize === 1 ? "Person" : "People"}
                    </span>
                  </div>
                  <input
                    type="range"
                    name="groupSize"
                    min={1}
                    max={12}
                    step={1}
                    value={formData.groupSize}
                    onChange={handleChange}
                    className="w-full h-2 bg-[#E3DBD0] rounded-lg appearance-none cursor-pointer accent-[#E86A45]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-[#8C8275] mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleChange}
                      className="w-full p-2.5 rounded-xl border border-[#E3DBD0] text-xs font-medium text-[#1E1B18] bg-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#8C8275] mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleChange}
                      className="w-full p-2.5 rounded-xl border border-[#E3DBD0] text-xs font-medium text-[#1E1B18] bg-transparent"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            <hr className="border-[#EDE7DC]" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-[#7A7166] uppercase tracking-wider mb-2">
                  Primary Transport
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "flight", label: "✈️ Flight" },
                    { id: "train", label: "🚆 Train" },
                    { id: "car", label: "🚗 Car / Cab" },
                    { id: "bus", label: "🚌 Bus" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, transportMode: t.id }))}
                      className={`p-2.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                        formData.transportMode === t.id
                          ? "bg-[#FCEEEA] border-[#E86A45] text-[#E86A45] ring-1 ring-[#E86A45]"
                          : "bg-[#FAF7F2]/60 border-[#EDE7DC] hover:border-[#D5CDC0] text-[#4A443E]"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#7A7166] uppercase tracking-wider mb-2">
                  Dietary Preference
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "vegetarian", label: "🌿 Vegetarian" },
                    { id: "jain", label: "🙏 Jain Friendly" },
                    { id: "halal", label: "🌙 Halal" },
                    { id: "no_restrictions", label: "🍲 All Foods" },
                  ].map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, dietary: d.id }))}
                      className={`p-2.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                        formData.dietary === d.id
                          ? "bg-[#FCEEEA] border-[#E86A45] text-[#E86A45] ring-1 ring-[#E86A45]"
                          : "bg-[#FAF7F2]/60 border-[#EDE7DC] hover:border-[#D5CDC0] text-[#4A443E]"
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                className="w-full py-4 rounded-2xl bg-[#E86A45] hover:bg-[#D95D39] text-white font-bold text-sm shadow-lg shadow-[#E86A45]/25 transition transform active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>✨</span> Generate Detailed Itinerary
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="text-center mt-6">
        <span className="text-[11px] text-[#A69E92]">
          Real-time pacing, budget estimation, and dynamic interactive mapping.
        </span>
      </div>
    </div>
  );
}