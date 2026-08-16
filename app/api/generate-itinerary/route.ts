import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      origin = "Delhi",
      destination = "Jaipur",
      startDate = new Date().toISOString().split("T")[0],
      endDate = new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0],
      groupSize = 2,
      totalBudgetINR = 35000,
      transportMode = "train",
      dietary = "vegetarian",
    } = body;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured in Vercel Environment Variables." },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    const d1 = new Date(startDate);
    const d2 = new Date(endDate);
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    const numDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);

    const prompt = `
      You are an expert AI travel planner for MusafirAI. Build a 100% realistic, authentic, day-wise travel itinerary for a real trip from ${origin} to ${destination}.

      TRIP PARAMETERS:
      - Origin: ${origin}
      - Destination: ${destination}
      - Duration: ${numDays} Days (${startDate} to ${endDate})
      - Travelers: ${groupSize} people
      - Total Budget Target: ₹${totalBudgetINR} INR
      - Preferred Transit Mode: ${transportMode}
      - Dietary Preference: ${dietary}

      STRICT CONTENT RULES:
      - Generate REAL, verified, iconic landmark names, real dining spots, and authentic activities in ${destination}.
      - DO NOT use generic phrases like "Visit famous landmark" or "Local restaurant". Give actual names (e.g. "Hadimba Devi Temple", "Cafe 1947", "Hawa Mahal", "Laxmi Mishthan Bhandar", etc.).
      - Allocate budget accurately based on ₹${totalBudgetINR} INR for ${groupSize} travelers.
      - Return exactly ${numDays} day objects in the "days" array.

      Return ONLY valid JSON matching this schema:
      {
        "tripTitle": "${destination} Exploration",
        "origin": "${origin}",
        "destination": "${destination}",
        "dateRangeLabel": "${startDate} – ${endDate}",
        "groupSize": ${Number(groupSize)},
        "transportMode": "${transportMode}",
        "dietary": "${dietary}",
        "budgetBreakdown": {
          "transportCostINR": ${Math.round(totalBudgetINR * 0.25)},
          "stayCostINR": ${Math.round(totalBudgetINR * 0.45)},
          "foodAndActivitiesCostINR": ${Math.round(totalBudgetINR * 0.30)},
          "totalCostINR": ${totalBudgetINR}
        },
        "stay": {
          "name": "Specific Real Hotel / Resort Name in ${destination}",
          "rating": 4.5,
          "highlight": "Specific real amenities and neighborhood"
        },
        "transitDetails": [
          {
            "mode": "${transportMode}",
            "name": "Realistic Transit Connection / Highway",
            "subtext": "Direct transit route connecting ${origin} to ${destination}",
            "estimatedPriceINR": ${Math.round(totalBudgetINR * 0.25)},
            "highwaysOrRoads": ["Main Transit Highway / Train Route / Flight Route"],
            "tips": "Practical booking and timing advice"
          }
        ],
        "days": [
          {
            "dayNumber": 1,
            "date": "${startDate}",
            "dayLabel": "Day 1",
            "theme": "Arrival & Initial Exploration",
            "aiReasoning": "Curated arrival flow with real local timing",
            "activities": [
              {
                "id": "act-1-1",
                "timeSlot": "10:00 AM",
                "title": "Specific Real Landmark / Activity",
                "description": "Engaging description of the actual place",
                "locationName": "Real Area / Street in ${destination}",
                "lat": 0.0,
                "lng": 0.0,
                "estimatedCostINR": 500,
                "category": "Sightseeing",
                "iconType": "sight"
              }
            ]
          }
        ]
      }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.3,
      },
    });

    let rawJson = response.text || "{}";
    rawJson = rawJson
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```$/i, "")
      .trim();

    const itineraryData = JSON.parse(rawJson);
    itineraryData.id = `${(destination || "trip").toLowerCase().replace(/\s+/g, "-")}-${Date.now().toString(36)}`;

    return NextResponse.json(itineraryData, { status: 200 });
  } catch (error: any) {
    console.error("Live AI Generation Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate live itinerary. Please check API parameters." },
      { status: 500 }
    );
  }
}