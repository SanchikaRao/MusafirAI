"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface Activity {
  id: string;
  timeSlot: string;
  title: string;
  description: string;
  locationName: string;
  lat: number;
  lng: number;
  estimatedCostINR: number;
  category: string;
  iconType: string;
}

interface DayItinerary {
  dayNumber: number;
  date: string;
  dayLabel: string;
  theme: string;
  aiReasoning: string;
  activities: Activity[];
}

interface BudgetBreakdown {
  transportCostINR?: number;
  stayCostINR?: number;
  foodAndActivitiesCostINR?: number;
  totalCostINR?: number;
}

interface StaySummary {
  name?: string;
  rating?: number;
  highlight?: string;
}

interface TransitOption {
  mode: string;
  name: string;
  subtext: string;
  estimatedPriceINR: number;
  highwaysOrRoads?: string[];
  tips?: string;
}

interface FullItinerary {
  id: string;
  tripTitle?: string;
  origin?: string;
  destination?: string;
  dateRangeLabel?: string;
  groupSize?: number;
  transportMode?: string;
  dietary?: string;
  budgetBreakdown?: BudgetBreakdown;
  stay?: StaySummary;
  transitDetails?: TransitOption[];
  days?: DayItinerary[];
}

export default function ItineraryPage() {
  const params = useParams();
  const [itinerary, setItinerary] = useState<FullItinerary | null>(null);
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [doneActivities, setDoneActivities] = useState<Record<string, boolean>>({});
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("current_itinerary");
    if (saved) {
      try {
        setItinerary(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, [params.id]);

  if (!itinerary || !itinerary.days || itinerary.days.length === 0) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex flex-col items-center justify-center p-6 text-slate-800">
        <div className="w-10 h-10 border-4 border-[#E86A45] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-serif text-lg">Loading your itinerary...</p>
        <Link className="mt-4 text-xs font-semibold text-[#E86A45] underline" href="/planner">
          Or return to planner to generate a new trip
        </Link>
      </div>
    );
  }

  const daysList = itinerary.days || [];
  const currentDayData = daysList.find((d) => d.dayNumber === selectedDay) || daysList[0];

  const toggleDone = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDoneActivities((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getEmoji = (iconType: string) => {
    switch (iconType?.toLowerCase()) {
      case "car": return "🚗";
      case "bed": return "🛏️";
      case "boat": return "⛵";
      case "food": return "🍽️";
      case "temple": return "🛕";
      case "bag": return "🛍️";
      case "leaf": return "🌿";
      default: return "📍";
    }
  };

  const getCategoryColor = (cat: string) => {
    switch (cat?.toLowerCase()) {
      case "food": return "bg-[#FCEAE6] text-[#D95D39]";
      case "leisure": return "bg-[#E6F4EA] text-[#2E7D32]";
      case "wrap up": return "bg-[#EBF3FC] text-[#1E6091]";
      default: return "bg-[#E8F4F8] text-[#347A8D]";
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: itinerary.tripTitle || "Travel Itinerary",
        text: `Check out our ${itinerary.tripTitle || "Travel"} itinerary!`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const validActivity = currentDayData?.activities?.find(
    (a) => a.lat && a.lng && (a.lat !== 0 || a.lng !== 0)
  );
  const mapCenterLat = validActivity?.lat || 15.2993;
  const mapCenterLng = validActivity?.lng || 74.1240;

  const totalCost = itinerary.budgetBreakdown?.totalCostINR || 35000;
  const transportCost = itinerary.budgetBreakdown?.transportCostINR || Math.round(totalCost * 0.2);
  const stayCost = itinerary.budgetBreakdown?.stayCostINR || Math.round(totalCost * 0.45);
  const foodCost = itinerary.budgetBreakdown?.foodAndActivitiesCostINR || Math.round(totalCost * 0.35);

  const isCarMode = itinerary.transportMode?.toLowerCase() === "car";

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#2D2A26] font-sans antialiased pb-20 selection:bg-[#E86A45] selection:text-white print:bg-white print:p-0 print:pb-0">
      
      {/* 1. Interactive Screen View */}
      <div className="print:hidden">
        <header className="max-w-7xl mx-auto pt-8 px-6 sm:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6">
            <div>
              <span className="text-[11px] font-bold tracking-[0.2em] text-[#E86A45] uppercase block mb-1">
                YOUR ITINERARY
              </span>
              <h1 className="text-4xl sm:text-5xl font-serif font-bold text-[#1E1B18] tracking-tight">
                {itinerary.tripTitle || `${itinerary.destination || "Trip"} Getaway`}
              </h1>
              <p className="text-sm text-[#736B63] mt-1 font-medium">
                {itinerary.origin} → {itinerary.destination} · {itinerary.groupSize || 1} travelers · {itinerary.dateRangeLabel || "Trip"}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="px-4 py-2 rounded-full bg-white border border-[#EDE8DF] shadow-xs text-xs font-semibold text-[#4A443E] flex items-center gap-1.5">
                <span>{isCarMode ? "🚗" : itinerary.transportMode === "flight" ? "✈️" : itinerary.transportMode === "train" ? "🚆" : "🚌"}</span>
                <span className="capitalize">{itinerary.transportMode}</span>
              </div>
              <div className="px-4 py-2 rounded-full bg-white border border-[#EDE8DF] shadow-xs text-xs font-semibold text-[#4A443E] flex items-center gap-1.5">
                <span>🥢</span> <span>{itinerary.dietary || "Vegetarian"}</span>
              </div>
              <div className="px-4 py-2 rounded-full bg-white border border-[#EDE8DF] shadow-xs text-xs font-semibold text-[#4A443E] flex items-center gap-1.5">
                <span>💰</span> <span>₹{totalCost.toLocaleString("en-IN")} total</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto pb-4 pt-2 scrollbar-none">
            {daysList.map((d) => {
              const isSelected = selectedDay === d.dayNumber;
              return (
                <button
                  key={d.dayNumber}
                  onClick={() => setSelectedDay(d.dayNumber)}
                  className={`flex-shrink-0 w-28 py-3.5 px-3 rounded-2xl transition-all duration-200 text-center cursor-pointer ${
                    isSelected
                      ? "bg-[#E86A45] text-white shadow-md shadow-[#E86A45]/20 scale-102"
                      : "bg-white border border-[#EBE5DB] text-[#4A443E] hover:border-[#D5CDC0] shadow-xs"
                  }`}
                >
                  <div className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${isSelected ? "text-white/80" : "text-[#9E9488]"}`}>
                    DAY 0{d.dayNumber}
                  </div>
                  <div className="font-serif font-bold text-lg leading-tight">
                    {d.dayLabel || `Day ${d.dayNumber}`}
                  </div>
                </button>
              );
            })}
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-6 sm:px-8 mt-4 grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
            {/* Transit Route Card */}
            {itinerary.transitDetails && itinerary.transitDetails.length > 0 && (
              <div className="bg-white border border-[#EDE7DC] rounded-3xl p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">
                      {isCarMode ? "🛣️" : itinerary.transportMode === "flight" ? "✈️" : itinerary.transportMode === "train" ? "🚆" : "🚌"}
                    </span>
                    <h3 className="font-serif font-bold text-base text-[#1E1B18]">
                      {isCarMode ? "Driving Route & Highways" : `Available ${itinerary.transportMode?.toUpperCase()} Options`}
                    </h3>
                  </div>
                  <span className="text-[11px] font-bold text-[#E86A45] bg-[#FCEEEA] px-3 py-1 rounded-full">
                    {itinerary.origin} → {itinerary.destination}
                  </span>
                </div>

                <div className="space-y-3">
                  {itinerary.transitDetails.map((transit, tIdx) => (
                    <div key={tIdx} className="bg-[#FAF7F2]/70 rounded-2xl p-4 border border-[#EDE7DC]">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-sm text-[#1E1B18]">{transit.name}</h4>
                          <p className="text-xs text-[#736B63] mt-0.5">{transit.subtext}</p>
                        </div>
                        <div className="sm:text-right">
                          <span className="text-xs font-extrabold text-[#E86A45]">
                            ≈ ₹{transit.estimatedPriceINR.toLocaleString("en-IN")}
                          </span>
                          <span className="text-[10px] text-[#8C8275] block">
                            {isCarMode ? "est. fuel & tolls" : "/ person"}
                          </span>
                        </div>
                      </div>

                      {transit.highwaysOrRoads && transit.highwaysOrRoads.length > 0 && (
                        <div className="mt-3 pt-2.5 border-t border-[#E8E2D8] flex flex-wrap items-center gap-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8275]">
                            Roads:
                          </span>
                          {transit.highwaysOrRoads.map((road, rIdx) => (
                            <span key={rIdx} className="px-2.5 py-0.5 rounded-md bg-white border border-[#DDD5C7] text-[11px] font-semibold text-[#4A443E]">
                              🛣️ {road}
                            </span>
                          ))}
                        </div>
                      )}

                      {transit.tips && (
                        <p className="text-[11px] text-[#6E665D] mt-2 italic">
                          💡 {transit.tips}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Reasoning Box */}
            <div className="bg-[#F2EDFC] border border-[#DDD0FA] rounded-2xl p-5 shadow-xs">
              <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-[#7C52C7] mb-1.5">
                <span>✦</span> AI REASONING FOR TODAY
              </div>
              <p className="text-xs sm:text-sm text-[#4E3875] leading-relaxed font-medium">
                {currentDayData?.aiReasoning || `Custom planned pacing for ${itinerary.destination} with verified ${itinerary.dietary || "local"} dining options.`}
              </p>
            </div>

            {/* Activity Cards */}
            <div className="relative pl-6 sm:pl-8 space-y-5">
              <div className="absolute left-2.5 sm:left-3.5 top-6 bottom-6 w-0.5 border-l-2 border-dashed border-[#E3DBD0]" />

              {(currentDayData?.activities || []).map((act, idx) => {
                const isDone = !!doneActivities[act.id];
                const isSelected = activeCardId === act.id || idx === 0;

                return (
                  <div key={act.id || idx} className="relative group">
                    <div
                      className={`absolute -left-6 sm:-left-8 top-7 w-4 h-4 rounded-full border-2 transition-all ${
                        isSelected
                          ? "bg-[#E86A45] border-[#E86A45] ring-4 ring-[#E86A45]/20"
                          : isDone
                          ? "bg-[#2E7D32] border-[#2E7D32]"
                          : "bg-[#FAF7F2] border-[#E86A45]"
                      }`}
                    />

                    <div
                      onClick={() => setActiveCardId(act.id)}
                      className={`bg-white rounded-2xl p-4 sm:p-5 transition-all duration-200 border cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs ${
                        isSelected
                          ? "border-2 border-[#E86A45] ring-2 ring-[#E86A45]/10 shadow-sm"
                          : "border-[#EDE7DC] hover:border-[#D9CFBF]"
                      }`}
                    >
                      <div className="flex items-start sm:items-center gap-4 flex-1">
                        <div className="w-14 h-14 rounded-2xl bg-[#F0EBE3]/70 flex items-center justify-center text-2xl flex-shrink-0">
                          {getEmoji(act.iconType)}
                        </div>

                        <div className="space-y-0.5">
                          <span className="text-xs font-bold text-[#E86A45] tracking-wide block">
                            {act.timeSlot}
                          </span>
                          <h3 className={`font-serif font-bold text-lg text-[#1E1B18] ${isDone ? "line-through opacity-50" : ""}`}>
                            {act.title}
                          </h3>
                          <div className="flex flex-wrap items-center gap-3 pt-1">
                            <span className="text-[11px] text-[#8C8275]">
                              Tap card for details
                            </span>
                            {idx % 2 === 1 && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  alert(`Finding alternatives for ${act.title}...`);
                                }}
                                className="text-[11px] font-bold text-[#E86A45] bg-[#FCEEEA] hover:bg-[#F9DDD6] px-2.5 py-0.5 rounded-full transition flex items-center gap-1 cursor-pointer"
                              >
                                ✦ Suggest alternative
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3">
                        <span className={`text-[11px] font-bold px-3 py-1 rounded-full ${getCategoryColor(act.category)}`}>
                          {act.category || "Sight"}
                        </span>

                        <label
                          onClick={(e) => toggleDone(act.id, e)}
                          className="flex items-center gap-1.5 text-xs text-[#736B63] cursor-pointer font-medium select-none"
                        >
                          <input
                            type="checkbox"
                            checked={isDone}
                            onChange={() => {}}
                            className="w-4 h-4 rounded border-[#D5CDC0] text-[#E86A45] focus:ring-0 cursor-pointer"
                          />
                          Done
                        </label>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6">
            {/* Interactive Route Map */}
            <div className="bg-white rounded-3xl p-5 border border-[#EDE7DC] shadow-xs">
              <div className="flex items-center gap-2 text-sm font-bold text-[#1E1B18] mb-3">
                <span className="text-[#347A8D]">🗺️</span> Route map
              </div>
              <div className="w-full h-56 rounded-2xl overflow-hidden border border-[#EDE7DC] relative bg-slate-100">
                <iframe
                  title="Route Map"
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  scrolling="no"
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${mapCenterLng - 0.08}%2C${mapCenterLat - 0.08}%2C${mapCenterLng + 0.08}%2C${mapCenterLat + 0.08}&layer=mapnik&marker=${mapCenterLat}%2C${mapCenterLng}`}
                />
              </div>
              <p className="text-[11px] text-[#8C8275] mt-2.5 leading-tight">
                Numbered pins follow today's order · dashed line shows the drive route
              </p>
            </div>

            {/* Hotel / Stay Card */}
            <div className="bg-white rounded-3xl p-5 border border-[#EDE7DC] shadow-xs">
              <div className="text-xs font-bold text-[#736B63] uppercase tracking-wider mb-3 flex items-center gap-2">
                <span>🛏️</span> Stay
              </div>
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#EBE5DB]/60 flex items-center justify-center text-xl">
                  🛏️
                </div>
                <div>
                  <h4 className="font-serif font-bold text-base text-[#1E1B18]">
                    {itinerary.stay?.name || `Top Stay in ${itinerary.destination || "Destination"}`}
                  </h4>
                  <p className="text-xs text-[#736B63] mt-0.5">
                    {itinerary.stay?.rating || 4.5}★ · {itinerary.stay?.highlight || "Central location"}
                  </p>
                </div>
              </div>
            </div>

            {/* Budget Breakdown */}
            <div className="bg-white rounded-3xl p-6 border border-[#EDE7DC] shadow-xs">
              <div className="text-xs font-bold text-[#736B63] uppercase tracking-wider mb-4 flex items-center gap-2">
                <span>💰</span> Budget
              </div>

              <div className="space-y-2.5 text-xs text-[#4A443E]">
                <div className="flex justify-between">
                  <span>Transport</span>
                  <span className="font-semibold">₹{transportCost.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between">
                  <span>Stay ({Math.max(1, daysList.length - 1)} nights)</span>
                  <span className="font-semibold">₹{stayCost.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between">
                  <span>Food & activities</span>
                  <span className="font-semibold">₹{foodCost.toLocaleString("en-IN")}</span>
                </div>

                <hr className="border-[#EDE7DC] my-3" />

                <div className="flex justify-between items-baseline pt-1">
                  <span className="font-serif font-bold text-base text-[#1E1B18]">Total</span>
                  <span className="font-serif font-extrabold text-xl text-[#1E1B18]">
                    ₹{totalCost.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-3xl p-5 border border-[#EDE7DC] shadow-xs space-y-3">
              <button
                onClick={handlePrint}
                className="w-full py-3.5 px-4 rounded-2xl bg-[#E86A45] hover:bg-[#D95D39] text-white font-bold text-xs shadow-md shadow-[#E86A45]/20 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>📄</span> Download Planned Trip (PDF)
              </button>

              <button
                onClick={handleShare}
                className="w-full py-3.5 px-4 rounded-2xl bg-white border border-[#E0D8CB] hover:bg-[#FAF7F2] text-[#4A443E] font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>🔗</span> {copied ? "Link Copied!" : "Share Itinerary"}
              </button>

              <div className="pt-2 text-center">
                <Link className="text-xs text-[#8C8275] hover:text-[#1E1B18] font-medium underline" href="/planner">
                  ← Plan another trip
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* 2. Print-Only View */}
      <div className="hidden print:block p-8 bg-white text-slate-900 font-sans">
        <div className="border-b-2 border-slate-900 pb-6 mb-8 flex justify-between items-start">
          <div>
            <span className="text-xs font-extrabold tracking-widest text-[#E86A45] uppercase block mb-1">
              TRIP BLUEPRINT & ITINERARY
            </span>
            <h1 className="text-3xl font-serif font-bold text-slate-950">
              {itinerary.tripTitle}
            </h1>
            <p className="text-sm font-semibold text-slate-600 mt-1">
              {itinerary.origin} → {itinerary.destination} · {itinerary.groupSize} Travelers · {itinerary.dateRangeLabel}
            </p>
          </div>
          <div className="text-right text-xs space-y-1">
            <div className="font-bold uppercase text-slate-500">Transit: {itinerary.transportMode}</div>
            <div className="font-bold text-slate-500">Diet: {itinerary.dietary}</div>
            <div className="font-extrabold text-base text-slate-950">₹{totalCost.toLocaleString("en-IN")} Total</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="p-4 rounded-xl border border-slate-300 bg-slate-50">
            <h3 className="text-xs font-black uppercase text-slate-700 tracking-wider mb-2">
              🚗 Transit Logistics
            </h3>
            {itinerary.transitDetails?.map((t, idx) => (
              <div key={idx} className="mb-2">
                <div className="font-bold text-xs text-slate-950">{t.name}</div>
                <div className="text-[11px] text-slate-600">{t.subtext}</div>
                {t.highwaysOrRoads && t.highwaysOrRoads.length > 0 && (
                  <div className="text-[10px] font-bold text-slate-500 mt-1">
                    Route: {t.highwaysOrRoads.join(" → ")}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="p-4 rounded-xl border border-slate-300 bg-slate-50">
            <h3 className="text-xs font-black uppercase text-slate-700 tracking-wider mb-2">
              🛏️ Stay & Budget
            </h3>
            <div className="font-bold text-xs text-slate-950">{itinerary.stay?.name}</div>
            <div className="text-[11px] text-slate-600">{itinerary.stay?.rating}★ · {itinerary.stay?.highlight}</div>
            <div className="text-[10px] font-semibold text-slate-600 mt-2">
              Transport: ₹{transportCost.toLocaleString("en-IN")} | Stay: ₹{stayCost.toLocaleString("en-IN")} | Food: ₹{foodCost.toLocaleString("en-IN")}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {daysList.map((day) => (
            <div key={day.dayNumber} className="border border-slate-300 rounded-2xl p-5 break-inside-avoid page-break-inside-avoid">
              <div className="flex justify-between items-center border-b border-slate-200 pb-3 mb-3">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded-md bg-[#E86A45] text-white text-xs font-black">
                    DAY {day.dayNumber}
                  </span>
                  <span className="font-serif font-bold text-lg text-slate-900">
                    {day.dayLabel} — {day.theme}
                  </span>
                </div>
              </div>

              {day.aiReasoning && (
                <p className="text-xs italic text-slate-600 mb-4 bg-purple-50 p-2.5 rounded-lg border border-purple-100">
                  ✦ {day.aiReasoning}
                </p>
              )}

              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 uppercase text-[10px] font-extrabold">
                    <th className="py-2 w-24">Time</th>
                    <th className="py-2">Activity / Landmark</th>
                    <th className="py-2">Category</th>
                    <th className="py-2 text-right">Est. Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {day.activities.map((act) => (
                    <tr key={act.id}>
                      <td className="py-2.5 font-bold text-[#E86A45]">{act.timeSlot}</td>
                      <td className="py-2.5">
                        <div className="font-bold text-slate-900">{act.title}</div>
                        <div className="text-[11px] text-slate-500">{act.locationName}</div>
                      </td>
                      <td className="py-2.5 font-semibold text-slate-600">{act.category}</td>
                      <td className="py-2.5 text-right font-bold text-slate-900">
                        ₹{act.estimatedCostINR.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>

        <div className="mt-8 pt-4 border-t border-slate-300 text-center text-[10px] text-slate-500">
          Generated with MusafirAI Smart Travel Planner. Keep this blueprint handy during transit.
        </div>
      </div>

    </div>
  );
}