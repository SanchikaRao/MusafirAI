import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      origin,
      destination,
      startDate,
      endDate,
      groupSize,
      totalBudgetINR,
      transportMode,
      dietary,
    } = body;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    const d1 = new Date(startDate);
    const d2 = new Date(endDate);
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    const numDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);

    const prompt = `
      You are an expert AI travel planner for MusafirAI. Build a 100% verified, authentic itinerary for ${origin} to ${destination}.

      TRIP CONSTRAINTS:
      - Route: ${origin} to ${destination}
      - Duration: ${numDays} Days (${startDate} to ${endDate})
      - Travelers: ${groupSize}
      - Total Budget Target: ₹${totalBudgetINR} INR
      - Chosen Transit Mode: ${transportMode}
      - Dietary Preference: ${dietary}

      REQUIRED JSON STRUCTURE ONLY:
      {
        "tripTitle": "${destination} Getaway",
        "origin": "${origin}",
        "destination": "${destination}",
        "dateRangeLabel": "${startDate} – ${endDate}",
        "groupSize": ${groupSize},
        "transportMode": "${transportMode}",
        "dietary": "${dietary}",
        "budgetBreakdown": {
          "transportCostINR": ${Math.round(totalBudgetINR * 0.2)},
          "stayCostINR": ${Math.round(totalBudgetINR * 0.45)},
          "foodAndActivitiesCostINR": ${Math.round(totalBudgetINR * 0.35)},
          "totalCostINR": ${totalBudgetINR}
        },
        "stay": {
          "name": "Recommended Stay in ${destination}",
          "rating": 4.5,
          "highlight": "Central prime location"
        },
        "transitDetails": [
          {
            "mode": "${transportMode}",
            "name": "Verified transit route",
            "subtext": "Timing and station details",
            "estimatedPriceINR": 2500,
            "highwaysOrRoads": ["NH 48"],
            "tips": "Recommended travel tip"
          }
        ],
        "days": [
          {
            "dayNumber": 1,
            "date": "${startDate}",
            "dayLabel": "Day 1",
            "theme": "Arrival & Exploration",
            "aiReasoning": "Paced schedule for ${destination}.",
            "activities": [
              {
                "id": "act-1",
                "timeSlot": "09:30 AM",
                "title": "Main Attraction in ${destination}",
                "description": "Highlights and exploration.",
                "locationName": "${destination}",
                "lat": 0.0,
                "lng": 0.0,
                "estimatedCostINR": 500,
                "category": "Sight",
                "iconType": "sight"
              }
            ]
          }
        ]
      }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.3,
      },
    });

    let rawJson = response.text || "{}";
    rawJson = rawJson
      .replace(/^```json\s*/, "")
      .replace(/^```\s*/, "")
      .replace(/```$/, "")
      .trim();

    const itineraryData = JSON.parse(rawJson);
    itineraryData.id = `${destination.toLowerCase().replace(/\s+/g, "-")}-${Date.now().toString(36)}`;

    return NextResponse.json(itineraryData);
  } catch (error: any) {
    console.error("API Route Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate itinerary" },
      { status: 500 }
    );
  }
}