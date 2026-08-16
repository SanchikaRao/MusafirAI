'use client';

export interface Activity {
  id: string;
  timeSlot: string;
  title: string;
  description: string;
  locationName: string;
  lat: number;
  lng: number;
  estimatedCostINR: number;
  category: string;
}

export interface DayItinerary {
  dayNumber: number;
  date: string;
  theme: string;
  culturalAlert?: string;
  activities: Activity[];
}

interface ItineraryTimelineProps {
  dayData?: DayItinerary;
  activeDay: number;
  totalDays: number;
  onSelectDay: (dayNumber: number) => void;
}

export default function ItineraryTimeline({
  dayData,
  activeDay,
  totalDays,
  onSelectDay,
}: ItineraryTimelineProps) {
  if (!dayData) {
    return (
      <div className="p-6 text-slate-400 text-center">
        No activities scheduled for this day.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Day Selector Navigation Tabs */}
      <div className="flex space-x-2 border-b border-slate-800 pb-3 overflow-x-auto">
        {Array.from({ length: totalDays }, (_, i) => i + 1).map((dayNum) => (
          <button
            key={dayNum}
            onClick={() => onSelectDay(dayNum)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
              activeDay === dayNum
                ? 'bg-amber-400 text-slate-950 shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Day {dayNum}
          </button>
        ))}
      </div>

      {/* Day Header */}
      <div className="border-b border-slate-800/60 pb-3">
        <h2 className="text-xl font-bold text-white">
          Day {dayData.dayNumber}: {dayData.theme}
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">{dayData.date}</p>
      </div>

      {/* Cultural Alert Card */}
      {dayData.culturalAlert && (
        <div className="bg-amber-950/40 border border-amber-500/30 rounded-xl p-4 flex items-start space-x-3 text-amber-200 text-sm">
          <span className="text-lg">🛕</span>
          <div>
            <strong className="block font-semibold text-amber-400 mb-0.5">
              Local Note & Attire Tip
            </strong>
            <p>{dayData.culturalAlert}</p>
          </div>
        </div>
      )}

      {/* Activities List */}
      <div className="space-y-4">
        {dayData.activities.map((act) => (
          <div
            key={act.id}
            className="bg-slate-900/80 border border-slate-800 hover:border-amber-400/50 transition-all p-4 rounded-xl space-y-2"
          >
            <div className="flex justify-between items-start">
              <span className="text-xs font-mono text-amber-400 bg-amber-950/60 border border-amber-800/40 px-2 py-0.5 rounded">
                {act.timeSlot}
              </span>
              <span className="text-xs font-semibold text-emerald-400">
                ₹{act.estimatedCostINR.toLocaleString('en-IN')}
              </span>
            </div>

            <h3 className="font-bold text-base text-white">{act.title}</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              {act.description}
            </p>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/50">
              <span>📍 {act.locationName}</span>
              <span className="capitalize px-2 py-0.5 bg-slate-800 rounded text-slate-300">
                {act.category}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}