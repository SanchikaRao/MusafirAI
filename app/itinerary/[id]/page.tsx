"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
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
  canSuggestAlt?: boolean;
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
  lat?: number;
  lng?: number;
  pricePerNightINR?: number;
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
  budgetBreakdown?: BudgetBreakdown;
  stay?: StayDetails;
  days: DayPlan[];
}

export default function ExactItineraryPage() {
  const params = useParams();
  const id = (params?.id as string) || "";

  const [itinerary, setItinerary] = useState<ItineraryData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeDay, setActiveDay] = useState<number>(1);
  const [completedActivities, setCompletedActivities] = useState<Record<string, boolean>>({});
  const [shareFeedback, setShareFeedback] = useState<string>("");

  // Map references
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const polylineLayerRef = useRef<any>(null);
  const [leafletLoaded, setLeafletLoaded] = useState<boolean>(false);

  const safeParse = (data: string | null): ItineraryData | null => {
    if (!data || data === "[object Object]") return null;
    try {
      return typeof data === "object" ? data : JSON.parse(data);
    } catch {
      return null;
    }
  };

  useEffect(() => {
    if (!id) return;

    const loadItinerary = async () => {
      setLoading(true);

      const cached =
        safeParse(localStorage.getItem(`itinerary_${id}`)) ||
        safeParse(localStorage.getItem("current_itinerary"));

      if (cached && cached.destination) {
        setItinerary(cached);
        setLoading(false);
        return;
      }

      try {
        const { data } = await supabase
          .from("trips")
          .select("itinerary_data")
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (data?.itinerary_data) {
          setItinerary(data.itinerary_data);
        }
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadItinerary();
  }, [id]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!document.getElementById("leaflet-stylesheet")) {
      const link = document.createElement("link");
      link.id = "leaflet-stylesheet";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    if (!(window as any).L) {
      const script = document.createElement("script");
      script.id = "leaflet-script";
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.async = true;
      script.onload = () => setLeafletLoaded(true);
      document.body.appendChild(script);
    } else {
      setLeafletLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!leafletLoaded || !itinerary || !mapContainerRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    const currentDayData =
      itinerary.days?.find((d) => d.dayNumber === activeDay) || itinerary.days?.[0];
    const activitiesWithCoords =
      currentDayData?.activities?.filter((a) => a.lat && a.lng && a.lat !== 0 && a.lng !== 0) || [];

    const defaultLat = activitiesWithCoords[0]?.lat || itinerary.stay?.lat || 32.2475;
    const defaultLng = activitiesWithCoords[0]?.lng || itinerary.stay?.lng || 77.1892;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
        attributionControl: false,
      }).setView([defaultLat, defaultLng], 12);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
      }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      polylineLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    const polylineLayer = polylineLayerRef.current;

    setTimeout(() => {
      map.invalidateSize();
    }, 150);

    markersLayer.clearLayers();
    polylineLayer.clearLayers();

    const points: [number, number][] = [];

    if (itinerary.stay?.lat && itinerary.stay?.lng) {
      const stayPin = L.divIcon({
        className: "hotel-map-pin",
        html: `<div style="background-color:#1E1B18;color:white;padding:3px 7px;border-radius:10px;font-size:10px;font-weight:bold;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);white-space:nowrap;">🏨 ${itinerary.stay.name}</div>`,
        iconSize: [110, 24],
        iconAnchor: [55, 12],
      });
      L.marker([itinerary.stay.lat, itinerary.stay.lng], { icon: stayPin })
        .bindPopup(`<b>${itinerary.stay.name}</b><br/>${itinerary.stay.highlight || ""}`)
        .addTo(markersLayer);
    }

    activitiesWithCoords.forEach((act, idx) => {
      const pt: [number, number] = [act.lat!, act.lng!];
      points.push(pt);

      const pin = L.divIcon({
        className: "timeline-map-pin",
        html: `<div style="background-color:#DE6B48;color:white;width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:bold;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);">${idx + 1}</div>`,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      });

      L.marker(pt, { icon: pin })
        .bindPopup(`<b>${idx + 1}. ${act.title}</b><br/>📍 ${act.locationName || ""}`)
        .addTo(markersLayer);
    });

    if (points.length > 1) {
      L.polyline(points, {
        color: "#DE6B48",
        weight: 3.5,
        opacity: 0.85,
        dashArray: "6, 8",
      }).addTo(polylineLayer);
    }

    if (points.length > 0) {
      const bounds = L.latLngBounds(points);
      if (itinerary.stay?.lat && itinerary.stay?.lng) {
        bounds.extend([itinerary.stay.lat, itinerary.stay.lng]);
      }
      map.fitBounds(bounds, { padding: [35, 35], maxZoom: 15 });
    }
  }, [activeDay, leafletLoaded, itinerary]);

  const handleShare = async () => {
    const shareUrl = window.location.href;
    const shareTitle = itinerary?.tripTitle || `${itinerary?.destination || "Trip"} Itinerary`;
    const shareText = `Check out this ${itinerary?.destination} itinerary crafted on MusafirAI!`;

    if (navigator.share) {
      try {
        await navigator.share({ title: shareTitle, text: shareText, url: shareUrl });
        return;
      } catch (err) {}
    }

    if (navigator.clipboard) {
      await navigator.clipboard.writeText(shareUrl);
      setShareFeedback("✓ Link copied!");
      setTimeout(() => setShareFeedback(""), 2500);
    }
  };

  const handleDownloadPDF = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const toggleDone = (actId: string) => {
    setCompletedActivities((prev) => ({ ...prev, [actId]: !prev[actId] }));
  };

  const getCategoryBadgeClass = (category?: string) => {
    const cat = (category || "").toLowerCase();
    if (cat.includes("food") || cat.includes("lunch") || cat.includes("dining")) {
      return "bg-[#FDEEE9] text-[#E06744]";
    }
    if (cat.includes("wrap") || cat.includes("transit") || cat.includes("travel")) {
      return "bg-[#E6F3F9] text-[#2980B9]";
    }
    return "bg-[#EBF7F8] text-[#2E97A7]";
  };

  const getActivityIcon = (act: Activity) => {
    const cat = (act.category || act.iconType || "").toLowerCase();
    if (cat.includes("food") || cat.includes("lunch") || cat.includes("dining")) return "🍽️";
    if (cat.includes("wrap") || cat.includes("transit") || cat.includes("cab") || cat.includes("travel")) return "🚗";
    if (cat.includes("flight") || cat.includes("airport")) return "✈️";
    return "🛍️";
  };

  const formatDayButtonDate = (dateStr?: string, index: number = 0) => {
    if (!dateStr) return `Day ${index + 1}`;
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } catch {
      return `Day ${index + 1}`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 border-4 border-[#DE6B48] border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-2xl font-serif font-bold text-[#1E1B18] mb-2">
          Loading your itinerary...
        </h2>
        <Link className="text-xs font-semibold text-[#DE6B48] hover:underline" href="/planner">
          Return to Planner →
        </Link>
      </div>
    );
  }

  if (!itinerary) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-serif font-bold text-[#1E1B18] mb-2">Itinerary Not Found</h2>
        <Link className="px-6 py-3 rounded-2xl bg-[#DE6B48] text-white font-bold text-xs shadow-md" href="/planner">
          Return to Planner
        </Link>
      </div>
    );
  }

  const currentDayData =
    itinerary.days?.find((d) => d.dayNumber === activeDay) || itinerary.days?.[0];

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#2D2A26] font-sans antialiased py-8 sm:py-12 px-4 sm:px-8 print:p-0 print:bg-white">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header (Shared between Screen & PDF) */}
        <header className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-2">
            <span className="text-[11px] font-bold tracking-widest text-[#E06744] uppercase block">
              YOUR ITINERARY
            </span>
            <h1 className="text-3xl sm:text-5xl font-serif font-bold text-[#1E1B18] tracking-tight leading-tight">
              {itinerary.tripTitle || `${itinerary.destination} Curated Itinerary`}
            </h1>
            <p className="text-xs sm:text-sm font-medium text-[#7A7166]">
              {itinerary.origin} → {itinerary.destination} · {itinerary.groupSize || 2} travelers ·{" "}
              {itinerary.dateRangeLabel || "Trip Schedule"}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end gap-2.5 shrink-0">
            <div className="flex items-center gap-2 print:hidden">
              <button
                onClick={handleShare}
                type="button"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-[#EBE3D5] text-xs font-bold text-[#4A443E] hover:bg-[#FAF8F5] transition shadow-2xs cursor-pointer"
              >
                <span>🔗</span>
                <span>{shareFeedback || "Share"}</span>
              </button>

              <button
                onClick={handleDownloadPDF}
                type="button"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#DE6B48] text-white text-xs font-bold hover:bg-[#C95937] transition shadow-2xs cursor-pointer"
              >
                <span>📥</span>
                <span>Download Full Trip PDF</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-white border border-[#EBE3D5] text-xs font-semibold text-[#4A443E] shadow-2xs">
                <span className="text-[#DE6B48]">
                  {itinerary.transportMode === "flight" ? "✈️" : itinerary.transportMode === "train" ? "🚆" : "🚗"}
                </span>{" "}
                <span className="capitalize">{itinerary.transportMode || "Car"}</span>
              </span>

              <span className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-white border border-[#EBE3D5] text-xs font-semibold text-[#4A443E] shadow-2xs">
                <span className="text-[#DE6B48]">🍴</span>{" "}
                <span className="capitalize">{itinerary.dietary || "No restrictions"}</span>
              </span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white border border-[#EBE3D5] text-xs font-bold text-[#1E1B18] shadow-2xs">
              <span className="text-amber-500">💰</span>
              <span>₹{itinerary.budgetBreakdown?.totalCostINR?.toLocaleString("en-IN") || "35,000"} total</span>
            </div>
          </div>
        </header>

        {/* ------------------------------------------------------------- */}
        {/* SCREEN-ONLY VIEW (Interactive Tabs + Selected Day + Map)      */}
        {/* ------------------------------------------------------------- */}
        <div className="space-y-8 print:hidden">
          {/* Day Selector Buttons */}
          {itinerary.days && itinerary.days.length > 0 && (
            <nav className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-none">
              {itinerary.days.map((day, idx) => {
                const isSelected = activeDay === day.dayNumber;
                return (
                  <button
                    key={day.dayNumber}
                    onClick={() => setActiveDay(day.dayNumber)}
                    className={`w-24 sm:w-28 py-3 rounded-2xl flex flex-col items-center justify-center transition cursor-pointer shrink-0 ${
                      isSelected
                        ? "bg-[#DE6B48] text-white shadow-md shadow-[#DE6B48]/20"
                        : "bg-white border border-[#EBE3D5] text-[#7A7166] hover:bg-[#F7F2E8]"
                    }`}
                  >
                    <span
                      className={`text-[9px] font-bold tracking-wider uppercase mb-0.5 ${
                        isSelected ? "text-white/80" : "text-[#A89F91]"
                      }`}
                    >
                      DAY {day.dayNumber < 10 ? `0${day.dayNumber}` : day.dayNumber}
                    </span>
                    <span className="font-serif font-bold text-base sm:text-lg leading-none">
                      {formatDayButtonDate(day.date, idx)}
                    </span>
                  </button>
                );
              })}
            </nav>
          )}

          {/* Interactive Screen Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7 space-y-6">
              {currentDayData?.aiReasoning && (
                <div className="p-5 rounded-2xl bg-[#F0EBFA] border border-[#E3D9F8] space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#7C3AED] uppercase tracking-wider">
                    <span>✦</span>
                    <span>AI REASONING FOR TODAY</span>
                  </div>
                  <p className="text-xs sm:text-sm text-[#4C3B71] leading-relaxed">
                    {currentDayData.aiReasoning}
                  </p>
                </div>
              )}

              <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-2.5 sm:before:left-3 before:top-4 before:bottom-4 before:w-0.5 before:border-l-2 before:border-dashed before:border-[#DECDBA]">
                {currentDayData?.activities?.map((act, index) => {
                  const isDone = completedActivities[act.id || index];
                  return (
                    <div key={act.id || index} className="relative group">
                      <div
                        className={`absolute -left-6 sm:-left-8 top-6 w-3.5 h-3.5 rounded-full border-2 border-white transition ${
                          index === 0
                            ? "bg-[#DE6B48] ring-4 ring-[#DE6B48]/20"
                            : "bg-[#DE6B48]/60"
                        }`}
                      />

                      <div
                        className={`p-5 rounded-2xl bg-white transition border ${
                          index === 0
                            ? "border-[#DE6B48] shadow-sm"
                            : "border-[#EBE3D5] shadow-2xs hover:border-[#DECDBA]"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#FAF7F2] border border-[#EDE5D8] flex items-center justify-center text-lg shrink-0">
                              {getActivityIcon(act)}
                            </div>
                            <div>
                              <span className="text-[11px] font-bold text-[#DE6B48] block">
                                {act.timeSlot || "Scheduled Time"}
                              </span>
                              <h3
                                className={`font-serif font-bold text-base sm:text-lg text-[#1E1B18] ${
                                  isDone ? "line-through text-[#9E9589]" : ""
                                }`}
                              >
                                {act.title}
                              </h3>
                            </div>
                          </div>

                          <span
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full capitalize shrink-0 ${getCategoryBadgeClass(
                              act.category
                            )}`}
                          >
                            {act.category || "Sight"}
                          </span>
                        </div>

                        <p className="text-xs text-[#7A7166] mt-2 mb-2 leading-relaxed">
                          {act.description}
                        </p>

                        {act.locationName && (
                          <div className="text-[11px] font-semibold text-[#8C8275] flex items-center gap-1 mb-3">
                            <span>📍 Location:</span>
                            <span className="text-[#1E1B18] font-bold">{act.locationName}</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-3 border-t border-[#F5EFE6] text-xs">
                          <div className="flex items-center gap-3">
                            <span className="text-[11px] text-[#A89F91] cursor-pointer hover:text-[#7A7166]">
                              Tap card for details
                            </span>
                            {(act.category?.toLowerCase().includes("food") || act.canSuggestAlt) && (
                              <button
                                type="button"
                                className="text-[11px] font-bold text-[#DE6B48] bg-[#FDF0EC] px-2.5 py-0.5 rounded-full hover:bg-[#FBE4DD] transition cursor-pointer"
                              >
                                ✦ Suggest alternative
                              </button>
                            )}
                          </div>

                          <label className="flex items-center gap-1.5 cursor-pointer select-none text-xs font-semibold text-[#7A7166]">
                            <input
                              type="checkbox"
                              checked={!!isDone}
                              onChange={() => toggleDone(act.id || String(index))}
                              className="rounded accent-[#DE6B48] w-4 h-4 cursor-pointer"
                            />
                            <span>Done</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="lg:col-span-5 space-y-6">
              <div className="p-5 rounded-3xl bg-white border border-[#EBE3D5] shadow-2xs space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[#1E1B18]">
                  <span>🗺️</span>
                  <span>Route map</span>
                </div>

                <div
                  ref={mapContainerRef}
                  style={{
                    height: "224px",
                    width: "100%",
                    minHeight: "224px",
                    position: "relative",
                    zIndex: 1,
                  }}
                  className="rounded-2xl border border-[#EBE3D5] overflow-hidden"
                />

                <p className="text-[11px] text-[#8C8275] leading-normal pt-1">
                  Numbered pins follow today's order · dashed line shows the drive route
                </p>
              </div>

              {itinerary.stay && (
                <div className="p-5 rounded-3xl bg-white border border-[#EBE3D5] shadow-2xs space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#7A7166] uppercase tracking-wider">
                    <span>🛏️</span>
                    <span>STAY</span>
                  </div>

                  <div className="flex items-start gap-3 pt-1">
                    <div className="w-10 h-10 rounded-xl bg-[#F0F5FA] text-blue-600 flex items-center justify-center text-base shrink-0">
                      🏨
                    </div>
                    <div>
                      <h4 className="font-serif font-bold text-base text-[#1E1B18] leading-snug">
                        {itinerary.stay.name}
                      </h4>
                      <p className="text-xs text-[#7A7166] mt-1 leading-relaxed">
                        {itinerary.stay.rating && (
                          <span className="font-semibold text-[#D97706]">
                            {itinerary.stay.rating}★ ·{" "}
                          </span>
                        )}
                        {itinerary.stay.highlight || "Centrally located boutique stay with verified amenities."}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {itinerary.budgetBreakdown && (
                <div className="p-6 rounded-3xl bg-white border border-[#EBE3D5] shadow-2xs space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#7A7166] uppercase tracking-wider">
                    <span>💰</span>
                    <span>BUDGET</span>
                  </div>

                  <div className="space-y-2.5 text-xs text-[#7A7166]">
                    <div className="flex justify-between">
                      <span>Transport</span>
                      <span className="font-semibold text-[#1E1B18]">
                        ₹{itinerary.budgetBreakdown.transportCostINR?.toLocaleString("en-IN") || "9,800"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Stay ({itinerary.days?.length ? `${itinerary.days.length - 1} nights` : "3 nights"})</span>
                      <span className="font-semibold text-[#1E1B18]">
                        ₹{itinerary.budgetBreakdown.stayCostINR?.toLocaleString("en-IN") || "14,700"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Food & activities</span>
                      <span className="font-semibold text-[#1E1B18]">
                        ₹{itinerary.budgetBreakdown.foodAndActivitiesCostINR?.toLocaleString("en-IN") || "10,500"}
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#F5EFE6] flex items-baseline justify-between">
                    <span className="font-serif font-bold text-base text-[#1E1B18]">Total</span>
                    <span className="font-serif font-bold text-2xl text-[#1E1B18]">
                      ₹{itinerary.budgetBreakdown.totalCostINR?.toLocaleString("en-IN") || "35,000"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* PRINT-ONLY VIEW: RENDERS ALL DAYS SEQUENTIALLY FOR THE PDF   */}
        {/* ------------------------------------------------------------- */}
        <div className="hidden print:block space-y-8 pt-4">
          {/* Stay & Budget Summary in PDF */}
          <div className="grid grid-cols-2 gap-4 pb-6 border-b border-[#EDE7DC]">
            {itinerary.stay && (
              <div className="p-4 rounded-xl border border-[#EDE7DC] bg-[#FAF8F5]">
                <span className="text-[10px] font-bold uppercase text-[#7A7166]">Recommended Stay</span>
                <h4 className="font-serif font-bold text-sm text-[#1E1B18] mt-1">{itinerary.stay.name}</h4>
                <p className="text-[11px] text-[#7A7166] mt-0.5">{itinerary.stay.highlight}</p>
              </div>
            )}
            {itinerary.budgetBreakdown && (
              <div className="p-4 rounded-xl border border-[#EDE7DC] bg-[#FAF8F5]">
                <span className="text-[10px] font-bold uppercase text-[#7A7166]">Estimated Budget</span>
                <div className="text-lg font-serif font-bold text-[#DE6B48] mt-1">
                  ₹{itinerary.budgetBreakdown.totalCostINR?.toLocaleString("en-IN")}
                </div>
                <div className="text-[10px] text-[#7A7166] mt-0.5">
                  Stay: ₹{itinerary.budgetBreakdown.stayCostINR?.toLocaleString("en-IN")} · Transit: ₹{itinerary.budgetBreakdown.transportCostINR?.toLocaleString("en-IN")}
                </div>
              </div>
            )}
          </div>

          {/* Render Every Day in Sequence */}
          {itinerary.days?.map((day) => (
            <div key={day.dayNumber} className="space-y-4 break-inside-avoid pb-8 border-b border-[#EDE7DC]">
              <div className="flex items-baseline justify-between border-b border-[#EDE7DC] pb-2">
                <div>
                  <span className="text-[10px] font-bold text-[#DE6B48] uppercase tracking-wider">
                    DAY {day.dayNumber < 10 ? `0${day.dayNumber}` : day.dayNumber}
                  </span>
                  <h3 className="font-serif font-bold text-xl text-[#1E1B18]">{day.theme}</h3>
                </div>
                <span className="text-xs font-semibold text-[#7A7166]">{day.date}</span>
              </div>

              {day.aiReasoning && (
                <p className="text-xs text-[#5B4F73] bg-[#F5F2FA] p-3 rounded-lg border border-[#E9E3F3]">
                  ✦ {day.aiReasoning}
                </p>
              )}

              <div className="space-y-3">
                {day.activities?.map((act, idx) => (
                  <div key={act.id || idx} className="p-3.5 rounded-xl border border-[#EBE3D5] bg-[#FAF8F5]">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-[#DE6B48]">{act.timeSlot}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-[#EDE7DC] text-[#7A7166]">
                        {act.category || "Sight"}
                      </span>
                    </div>
                    <h4 className="font-serif font-bold text-sm text-[#1E1B18] mt-1">{act.title}</h4>
                    <p className="text-xs text-[#7A7166] mt-1">{act.description}</p>
                    {act.locationName && (
                      <p className="text-[11px] font-semibold text-[#8C8275] mt-1.5">📍 {act.locationName}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}