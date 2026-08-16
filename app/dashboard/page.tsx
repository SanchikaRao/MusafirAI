"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

interface TripRecord {
  id: string;
  trip_title: string;
  origin: string;
  destination: string;
  start_date: string;
  end_date: string;
  total_budget_inr: number;
  transport_mode: string;
  status: "upcoming" | "completed" | "cancelled";
  itinerary_data: any;
}

export default function DashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"upcoming" | "completed">("upcoming");
  const [trips, setTrips] = useState<TripRecord[]>([]);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUserDataAndTrips() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        // Fallback for local cache when not authenticated
        const localSaved = localStorage.getItem("current_itinerary");
        if (localSaved) {
          try {
            const parsed = JSON.parse(localSaved);
            setTrips([
              {
                id: parsed.id || "local-trip",
                trip_title: parsed.tripTitle || "Your Planned Getaway",
                origin: parsed.origin || "Delhi",
                destination: parsed.destination || "Goa",
                start_date: "2026-09-01",
                end_date: "2026-09-04",
                total_budget_inr: parsed.budgetBreakdown?.totalCostINR || 35000,
                transport_mode: parsed.transportMode || "flight",
                status: "upcoming",
                itinerary_data: parsed,
              },
            ]);
          } catch (e) {}
        }
        setLoading(false);
        return;
      }

      setUserEmail(user.email || user.phone || "Traveler");

      const { data, error } = await supabase
        .from("trips")
        .select("*")
        .order("start_date", { ascending: true });

      if (data && !error) {
        setTrips(data);
      }
      setLoading(false);
    }

    loadUserDataAndTrips();
  }, []);

  const handleToggleStatus = async (tripId: string, currentStatus: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newStatus = currentStatus === "upcoming" ? "completed" : "upcoming";

    // Optimistic UI state update
    setTrips((prev) =>
      prev.map((t) => (t.id === tripId ? { ...t, status: newStatus as any } : t))
    );

    await supabase.from("trips").update({ status: newStatus }).eq("id", tripId);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth");
  };

  const filteredTrips = trips.filter((t) => t.status === activeTab);

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#2D2A26] pb-20 selection:bg-[#E86A45] selection:text-white">
      {/* Navigation */}
      <nav className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between border-b border-[#EDE7DC]">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#E86A45] text-white flex items-center justify-center font-serif text-sm font-bold shadow-md shadow-[#E86A45]/20">
            ✦
          </div>
          <span className="font-serif font-bold text-xl text-[#1E1B18]">MusafirAI</span>
        </Link>

        <div className="flex items-center gap-3">
          {userEmail && (
            <span className="text-xs font-semibold text-[#7A7166] hidden sm:inline">
              👤 {userEmail}
            </span>
          )}
          <Link
            href="/planner"
            className="px-4 py-2 rounded-full bg-[#E86A45] text-white text-xs font-bold hover:bg-[#D95D39] transition shadow-xs"
          >
            + Plan New Trip
          </Link>
          <button
            onClick={handleLogout}
            className="px-3.5 py-2 rounded-full bg-white border border-[#E3DBD0] text-xs font-bold text-[#4A443E] hover:bg-[#F2ECE1] transition cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 pt-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#1E1B18]">
              Your Journeys
            </h1>
            <p className="text-xs sm:text-sm text-[#7A7166] mt-1">
              Switch between your upcoming itineraries and past travel blueprints.
            </p>
          </div>

          {/* Status Tab Toggle */}
          <div className="inline-flex bg-white p-1 rounded-2xl border border-[#EDE7DC] shadow-xs">
            <button
              onClick={() => setActiveTab("upcoming")}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === "upcoming"
                  ? "bg-[#E86A45] text-white shadow-xs"
                  : "text-[#7A7166] hover:text-[#1E1B18]"
              }`}
            >
              📅 Upcoming ({trips.filter((t) => t.status === "upcoming").length})
            </button>
            <button
              onClick={() => setActiveTab("completed")}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === "completed"
                  ? "bg-[#E86A45] text-white shadow-xs"
                  : "text-[#7A7166] hover:text-[#1E1B18]"
              }`}
            >
              ✅ Completed History ({trips.filter((t) => t.status === "completed").length})
            </button>
          </div>
        </div>

        {/* Trips List */}
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-10 h-10 border-4 border-[#E86A45] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-semibold text-[#8C8275]">Loading your travel blueprints...</p>
          </div>
        ) : filteredTrips.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-[#EDE7DC] max-w-md mx-auto my-12 shadow-xs">
            <span className="text-4xl block mb-3">🧭</span>
            <h3 className="font-serif font-bold text-lg text-[#1E1B18]">
              No {activeTab} trips found
            </h3>
            <p className="text-xs text-[#7A7166] mt-1 mb-6">
              {activeTab === "upcoming"
                ? "Start planning your next adventure with verified routes and daily pacing."
                : "Your completed travel logs will appear here once marked done."}
            </p>
            <Link
              href="/planner"
              className="px-6 py-3 rounded-2xl bg-[#E86A45] text-white font-bold text-xs shadow-md shadow-[#E86A45]/20 hover:bg-[#D95D39] transition inline-block"
            >
              Plan an Adventure →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTrips.map((trip) => (
              <div
                key={trip.id}
                onClick={() => {
                  localStorage.setItem("current_itinerary", JSON.stringify(trip.itinerary_data));
                  router.push(`/itinerary/${trip.id}`);
                }}
                className="bg-white rounded-3xl p-6 border border-[#EDE7DC] hover:border-[#D5CDC0] shadow-xs hover:shadow-md transition duration-200 flex flex-col justify-between cursor-pointer group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold text-[#E86A45] uppercase tracking-wider bg-[#FCEEEA] px-2.5 py-0.5 rounded-full">
                      {trip.transport_mode}
                    </span>
                    <span className="text-xs font-semibold text-[#8C8275]">
                      {trip.start_date} – {trip.end_date}
                    </span>
                  </div>

                  <h3 className="font-serif font-bold text-xl text-[#1E1B18] group-hover:text-[#E86A45] transition">
                    {trip.trip_title}
                  </h3>
                  <p className="text-xs font-semibold text-[#7A7166] mt-1">
                    {trip.origin} → {trip.destination}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-[#EDE7DC] flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-[#1E1B18] block">
                      ₹{trip.total_budget_inr.toLocaleString("en-IN")}
                    </span>
                    <button
                      onClick={(e) => handleToggleStatus(trip.id, trip.status, e)}
                      className="text-[10px] text-[#8C8275] hover:text-[#E86A45] font-semibold underline mt-1 cursor-pointer"
                    >
                      {trip.status === "upcoming" ? "Mark as Completed" : "Move to Upcoming"}
                    </button>
                  </div>
                  <span className="text-[#E86A45] font-bold group-hover:translate-x-1 transition">
                    View Blueprint →
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}