"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../../lib/supabase";

interface Activity {
  id: string;
  timeSlot?: string;
  title: string;
  description: string;
  locationName: string;
  lat?: number;
  lng?: number;
  estimatedCostINR?: number;
  category?: string;
  iconType?: string;
}

interface DayPlan {
  dayNumber: number;
  date?: string;
  dayLabel?: string;
  theme?: string;
  aiReasoning?: string;
  activities: Activity[];
}

interface StayDetails {
  name: string;
  rating?: number;
  highlight?: string;
  pricePerNightINR?: number;
  bookingUrl?: string;
}

interface TransitDetail {
  mode: string;
  name: string;
  subtext?: string;
  estimatedPriceINR?: number;
  highwaysOrRoads?: string[];
  tips?: string;
}

interface BudgetBreakdown {
  transportCostINR?: number;
  stayCostINR?: number;
  foodAndActivitiesCostINR?: number;
  totalCostINR?: number;
}

interface ItineraryData {
  id: string;
  tripTitle?: string;
  origin: string;
  destination: string;
  dateRangeLabel?: string;
  groupSize?: number;
  transportMode?: string;
  dietary?: string;
  pace?: string;
  stayType?: string;
  budgetBreakdown?: BudgetBreakdown;
  stay?: StayDetails;
  transitDetails?: TransitDetail[];
  days: DayPlan[];
  rawNotes?: string;
}

export default function DynamicItineraryPage() {
  const params = useParams();
  const router = useRouter();
  const id = (params?.id as string) || "";

  // State Management
  const [itinerary, setItinerary] = useState<ItineraryData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeDay, setActiveDay] = useState<number>(1);
  const [copied, setCopied] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [savingTrip, setSavingTrip] = useState<boolean>(false);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>("all");

  // Load Itinerary Data with multiple fallbacks
  useEffect(() => {
    if (!id) return;

    const loadData = async () => {
      setLoading(true);

      // Tier 1: Check localStorage under specific itinerary ID
      let storedJson = localStorage.getItem(`itinerary_${id}`);

      // Tier 2: Check localStorage under current_itinerary
      if (!storedJson) {
        storedJson = localStorage.getItem("current_itinerary");
      }

      if (storedJson) {
        try {
          const parsed: ItineraryData = JSON.parse(storedJson);
          setItinerary(parsed);
          setLoading(false);
          return;
        } catch (err) {
          console.warn("Failed parsing cached itinerary, checking database...", err);
        }
      }

      // Tier 3: Supabase Database Query
      try {
        const { data, error } = await supabase
          .from("trips")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (!error && data?.itinerary_data) {
          setItinerary(data.itinerary_data);
          setIsSaved(true);
        }
      } catch (dbErr) {
        console.error("Database retrieval failed:", dbErr);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  // Share link handler
  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // Save trip to Supabase
  const handleSaveTrip = async () => {
    if (!itinerary || isSaved) return;
    setSavingTrip(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        await supabase.from("trips").insert({
          user_id: user.id,
          trip_title: itinerary.tripTitle || `${itinerary.destination} Exploration`,
          origin: itinerary.origin,
          destination: itinerary.destination,
          group_size: itinerary.groupSize || 2,
          total_budget_inr: itinerary.budgetBreakdown?.totalCostINR || 35000,
          transport_mode: itinerary.transportMode || "flight",
          dietary: itinerary.dietary || "vegetarian",
          status: "saved",
          itinerary_data: itinerary,
        });
        setIsSaved(true);
      } else {
        router.push("/auth");
      }
    } catch (err) {
      console.error("Failed saving trip:", err);
    } finally {
      setSavingTrip(false);
    }
  };

  // Print/Export PDF
  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 border-4 border-[#E86A45] border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-2xl font-serif font-bold text-[#1E1B18] mb-2">
          Loading your itinerary...
        </h2>
        <p className="text-xs sm:text-sm text-[#7A7166] max-w-sm">
          Retrieving day schedules, verified landmark routes, and budget parameters.
        </p>
        <Link
          href="/planner"
          className="mt-6 text-xs font-bold text-[#E86A45] hover:underline"
        >
          Or return to planner to generate a new trip →
        </Link>
      </div>
    );
  }

  if (!itinerary) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 rounded-full bg-[#FAF3F0] text-[#E86A45] text-2xl flex items-center justify-center mb-4">
          ⚠️
        </div>
        <h2 className="text-2xl font-serif font-bold text-[#1E1B18] mb-2">
          Itinerary Not Found
        </h2>
        <p className="text-xs sm:text-sm text-[#7A7166] max-w-md mb-6">
          We couldn't retrieve cached data or database records for this trip session.
        </p>
        <Link
          href="/planner"
          className="px-6 py-3 rounded-2xl bg-[#E86A45] text-white font-bold text-xs shadow-md hover:bg-[#D95D39] transition"
        >
          Return to Planner
        </Link>
      </div>
    );
  }

  const currentDay =
    itinerary.days?.find((d) => d.dayNumber === activeDay) || itinerary.days?.[0];

  const filteredActivities = currentDay?.activities?.filter((act) => {
    if (activeCategoryFilter === "all") return true;
    return act.category?.toLowerCase() === activeCategoryFilter.toLowerCase();
  });

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#2D2A26] pb-24">
      {/* Top Navbar */}
      <nav className="bg-white/95 backdrop-blur-md border-b border-[#EDE7DC] sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/planner"
              className="text-xs font-bold text-[#7A7166] hover:text-[#E86A45] transition flex items-center gap-1.5"
            >
              ← Edit Itinerary
            </Link>
            <div className="hidden sm:block h-4 w-px bg-[#EDE7DC]" />
            <span className="hidden sm:block font-serif font-bold text-base text-[#1E1B18]">
              {itinerary.destination} <span className="text-[#E86A45]">Plan</span>
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={handleShare}
              className="px-3.5 py-1.5 rounded-full border border-[#EDE7DC] bg-white text-xs font-bold text-[#4A443E] hover:bg-[#FAF8F5] transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              {copied ? "✓ Copied!" : "🔗 Share"}
            </button>

            <button
              onClick={handlePrint}
              className="hidden sm:flex px-3.5 py-1.5 rounded-full border border-[#EDE7DC] bg-white text-xs font-bold text-[#4A443E] hover:bg-[#FAF8F5] transition items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              🖨️ Export PDF
            </button>

            <button
              onClick={handleSaveTrip}
              disabled={savingTrip || isSaved}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer ${
                isSaved
                  ? "bg-[#E6F4EA] text-[#137333] border border-[#CEEAD6]"
                  : "bg-[#E86A45] text-white hover:bg-[#D95D39]"
              }`}
            >
              {isSaved ? "✓ Saved to Profile" : savingTrip ? "Saving..." : "💾 Save Trip"}
            </button>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 space-y-8">
        {/* Header Hero Section */}
        <section className="bg-white rounded-3xl p-6 sm:p-10 border border-[#EDE7DC] shadow-xs relative overflow-hidden">
          <div className="relative z-10 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold tracking-widest text-[#E86A45] uppercase bg-[#FAF3F0] px-3.5 py-1 rounded-full border border-[#F5DDD4]">
                  {itinerary.dateRangeLabel || `${itinerary.days?.length || 3} Days Adventure`}
                </span>
                <span className="text-xs font-semibold text-[#8C8275] bg-[#FAF8F5] px-3 py-1 rounded-full border border-[#EDE7DC]">
                  {itinerary.groupSize || 2} Travelers
                </span>
              </div>
              <div className="text-xs font-bold text-[#7A7166] flex items-center gap-2">
                <span>🍽️ {itinerary.dietary || "Vegetarian"}</span>
                <span>·</span>
                <span className="capitalize">🚀 {itinerary.transportMode || "Flight"}</span>
              </div>
            </div>

            <h1 className="text-3xl sm:text-5xl font-serif font-bold text-[#1E1B18] tracking-tight">
              {itinerary.tripTitle || `${itinerary.destination} Complete Itinerary`}
            </h1>

            <p className="text-xs sm:text-sm text-[#7A7166] max-w-2xl leading-relaxed">
              Curated travel from <span className="font-bold text-[#1E1B18]">{itinerary.origin}</span> to{" "}
              <span className="font-bold text-[#1E1B18]">{itinerary.destination}</span>. Balanced daily
              time allocations, authentic cuisines, and landmark pacing.
            </p>

            {/* Budget Breakdown Cards */}
            {itinerary.budgetBreakdown && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-[#EDE7DC]">
                <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#EDE7DC]">
                  <span className="text-[10px] uppercase font-bold text-[#8C8275] tracking-wider block">
                    TOTAL BUDGET
                  </span>
                  <div className="text-xl sm:text-2xl font-serif font-bold text-[#E86A45] mt-1">
                    ₹{itinerary.budgetBreakdown.totalCostINR?.toLocaleString("en-IN") || "35,000"}
                  </div>
                </div>

                <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#EDE7DC]">
                  <span className="text-[10px] uppercase font-bold text-[#8C8275] tracking-wider block">
                    STAYS ALLOCATION
                  </span>
                  <div className="text-base sm:text-lg font-bold text-[#1E1B18] mt-1">
                    ₹{itinerary.budgetBreakdown.stayCostINR?.toLocaleString("en-IN") || "15,000"}
                  </div>
                </div>

                <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#EDE7DC]">
                  <span className="text-[10px] uppercase font-bold text-[#8C8275] tracking-wider block">
                    TRANSIT FARES
                  </span>
                  <div className="text-base sm:text-lg font-bold text-[#1E1B18] mt-1">
                    ₹{itinerary.budgetBreakdown.transportCostINR?.toLocaleString("en-IN") || "8,000"}
                  </div>
                </div>

                <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#EDE7DC]">
                  <span className="text-[10px] uppercase font-bold text-[#8C8275] tracking-wider block">
                    FOOD & TICKETS
                  </span>
                  <div className="text-base sm:text-lg font-bold text-[#1E1B18] mt-1">
                    ₹{itinerary.budgetBreakdown.foodAndActivitiesCostINR?.toLocaleString("en-IN") || "12,000"}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Accommodation and Transit Highlights */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Stay Card */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#EDE7DC] shadow-xs flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-[#E86A45] tracking-wider uppercase bg-[#FAF3F0] px-3 py-0.5 rounded-full border border-[#F5DDD4]">
                  RECOMMENDED STAY
                </span>
                {itinerary.stay?.rating && (
                  <span className="text-xs font-bold text-[#D97706] bg-[#FEF3C7] px-2.5 py-0.5 rounded-full">
                    ★ {itinerary.stay.rating}
                  </span>
                )}
              </div>
              <h3 className="font-serif font-bold text-2xl text-[#1E1B18]">
                {itinerary.stay?.name || `Premium Stay in ${itinerary.destination}`}
              </h3>
              <p className="text-xs sm:text-sm text-[#7A7166] mt-2 leading-relaxed">
                {itinerary.stay?.highlight ||
                  "Verified central neighborhood offering scenic views, clean amenities, and easy commute access."}
              </p>
            </div>
            <div className="pt-4 border-t border-[#EDE7DC] flex items-center justify-between text-xs font-semibold text-[#8C8275]">
              <span>📍 Central Location</span>
              <span>🔒 Verified Sanitization</span>
            </div>
          </div>

          {/* Transit Details Card */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#EDE7DC] shadow-xs flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-[#E86A45] tracking-wider uppercase bg-[#FAF3F0] px-3 py-0.5 rounded-full border border-[#F5DDD4]">
                  TRANSIT & LOGISTICS
                </span>
                <span className="text-xs font-bold text-[#7A7166] capitalize">
                  {itinerary.transportMode || "Direct Transit"}
                </span>
              </div>
              <h3 className="font-serif font-bold text-2xl text-[#1E1B18]">
                {itinerary.transitDetails?.[0]?.name ||
                  `Route: ${itinerary.origin} ➔ ${itinerary.destination}`}
              </h3>
              <p className="text-xs sm:text-sm text-[#7A7166] mt-2 leading-relaxed">
                {itinerary.transitDetails?.[0]?.subtext ||
                  itinerary.transitDetails?.[0]?.tips ||
                  "Recommended departure during morning hours to avoid peak congestion and ensure optimal daylight transit."}
              </p>
            </div>
            <div className="pt-4 border-t border-[#EDE7DC] flex items-center justify-between text-xs font-bold">
              <span className="text-[#8C8275]">Est. Fare Allocation</span>
              <span className="text-[#E86A45]">
                ₹{itinerary.transitDetails?.[0]?.estimatedPriceINR?.toLocaleString("en-IN") ||
                  itinerary.budgetBreakdown?.transportCostINR?.toLocaleString("en-IN") ||
                  "6,500"}
              </span>
            </div>
          </div>
        </section>

        {/* Day Selector Navigation Tabs */}
        {itinerary.days && itinerary.days.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-serif font-bold text-2xl text-[#1E1B18]">Daily Itinerary Schedule</h2>
              <div className="text-xs font-semibold text-[#8C8275]">
                Showing Day {activeDay} of {itinerary.days.length}
              </div>
            </div>

            {/* Scrollable Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {itinerary.days.map((day) => (
                <button
                  key={day.dayNumber}
                  onClick={() => setActiveDay(day.dayNumber)}
                  className={`px-5 py-3 rounded-2xl text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-2 ${
                    activeDay === day.dayNumber
                      ? "bg-[#E86A45] text-white shadow-md shadow-[#E86A45]/25 scale-102"
                      : "bg-white border border-[#EDE7DC] text-[#7A7166] hover:bg-[#FAF8F5]"
                  }`}
                >
                  <span>Day {day.dayNumber}</span>
                  {day.theme && (
                    <span
                      className={`text-[10px] font-normal ${
                        activeDay === day.dayNumber ? "text-white/80" : "text-[#8C8275]"
                      }`}
                    >
                      · {day.theme}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Active Day Content Panel */}
            {currentDay && (
              <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#EDE7DC] shadow-xs space-y-8">
                {/* Day Overview Header */}
                <div className="border-b border-[#EDE7DC] pb-6">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-[#E86A45] uppercase tracking-wider">
                      {currentDay.dayLabel || `Day ${currentDay.dayNumber}`} Timeline
                    </span>
                    {currentDay.date && (
                      <span className="text-xs font-semibold text-[#8C8275]">{currentDay.date}</span>
                    )}
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-serif font-bold text-[#1E1B18] mt-1">
                    {currentDay.theme || "Exploration & Local Highlights"}
                  </h3>
                  {currentDay.aiReasoning && (
                    <p className="text-xs sm:text-sm text-[#7A7166] mt-2 italic max-w-3xl leading-relaxed">
                      "{currentDay.aiReasoning}"
                    </p>
                  )}
                </div>

                {/* Category Filters */}
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: "all", label: "All Sights" },
                    { id: "sightseeing", label: "🏛️ Sightseeing" },
                    { id: "food", label: "🍲 Food & Cafes" },
                    { id: "activity", label: "🎯 Activities" },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategoryFilter(cat.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                        activeCategoryFilter === cat.id
                          ? "bg-[#1E1B18] text-white"
                          : "bg-[#FAF7F2] text-[#7A7166] border border-[#EDE7DC] hover:bg-[#F2ECE1]"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Activity Timeline List */}
                <div className="space-y-4">
                  {filteredActivities && filteredActivities.length > 0 ? (
                    filteredActivities.map((act, index) => (
                      <div
                        key={act.id || index}
                        className="p-5 sm:p-6 rounded-2xl bg-[#FAF8F5] border border-[#EDE7DC] flex flex-col sm:flex-row sm:items-start justify-between gap-4 hover:border-[#D5CDC0] transition"
                      >
                        <div className="space-y-2 max-w-2xl">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#E86A45] bg-[#FAF3F0] px-2.5 py-1 rounded-full border border-[#F5DDD4]">
                              {act.timeSlot || "Scheduled Slot"}
                            </span>
                            {act.category && (
                              <span className="text-xs font-bold text-[#8C8275] capitalize">
                                • {act.category}
                              </span>
                            )}
                          </div>
                          <h4 className="font-serif font-bold text-lg text-[#1E1B18]">
                            {act.title}
                          </h4>
                          <p className="text-xs sm:text-sm text-[#7A7166] leading-relaxed">
                            {act.description}
                          </p>
                          <div className="text-[11px] font-semibold text-[#8C8275] flex items-center gap-1 pt-1">
                            <span>📍 Location:</span>
                            <span className="text-[#1E1B18]">{act.locationName}</span>
                          </div>
                        </div>

                        {act.estimatedCostINR !== undefined && (
                          <div className="sm:text-right shrink-0 bg-white sm:bg-transparent p-3 sm:p-0 rounded-xl border sm:border-0 border-[#EDE7DC]">
                            <span className="text-[10px] font-bold text-[#8C8275] uppercase block">
                              EST. COST
                            </span>
                            <span className="text-base font-bold text-[#1E1B18]">
                              ₹{act.estimatedCostINR.toLocaleString("en-IN")}
                            </span>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-xs text-[#8C8275]">
                      No activities match the selected filter for this day.
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Footer Navigation Back to Planner */}
        <section className="text-center pt-8 border-t border-[#EDE7DC]">
          <Link
            href="/planner"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-[#E86A45] text-white font-bold text-xs shadow-md hover:bg-[#D95D39] transition"
          >
            ← Modify Inputs in Planner
          </Link>
          <p className="text-[11px] text-[#A69E92] mt-3">
            Generated with real-time Gemini reasoning and optimized for authentic travel pacing.
          </p>
        </section>
      </main>
    </div>
  );
}