import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

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
      console.error("Missing GEMINI_API_KEY environment variable");
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
      You are an expert AI travel planner for MusafirAI. Build a 100% verified, authentic itinerary for ${origin} to ${destination}.

      TRIP PARAMETERS:
      - Origin: ${origin}
      - Destination: ${destination}
      - Duration: ${numDays} Days (${startDate} to ${endDate})
      - Travelers: ${groupSize}
      - Total Budget Target: ₹${totalBudgetINR} INR
      - Chosen Transit Mode: ${transportMode}
      - Dietary Preference: ${dietary}

      Return ONLY valid raw JSON with no Markdown formatting matching this schema:
      {
        "tripTitle": "${destination} Getaway",
        "origin": "${origin}",
        "destination": "${destination}",
        "dateRangeLabel": "${startDate} – ${endDate}",
        "groupSize": ${groupSize},
        "transportMode": "${transportMode}",
        "dietary": "${dietary}",
        "budgetBreakdown": {
          "transportCostINR": ${Math.round(totalBudgetINR * 0.25)},
          "stayCostINR": ${Math.round(totalBudgetINR * 0.45)},
          "foodAndActivitiesCostINR": ${Math.round(totalBudgetINR * 0.30)},
          "totalCostINR": ${totalBudgetINR}
        },
        "stay": {
          "name": "Recommended Hotel in ${destination}",
          "rating": 4.5,
          "highlight": "Centrally located with verified amenities"
        },
        "transitDetails": [
          {
            "mode": "${transportMode}",
            "name": "Primary Transit Connection",
            "subtext": "Direct route connecting ${origin} to ${destination}",
            "estimatedPriceINR": ${Math.round(totalBudgetINR * 0.25)},
            "highwaysOrRoads": ["Main Route"],
            "tips": "Book advance tickets for best rates"
          }
        ],
        "days": [
          {
            "dayNumber": 1,
            "date": "${startDate}",
            "dayLabel": "Day 1",
            "theme": "Arrival & Exploration",
            "aiReasoning": "Optimized exploration schedule for ${destination}.",
            "activities": [
              {
                "id": "act-1",
                "timeSlot": "10:00 AM",
                "title": "Iconic Landmark Visit",
                "description": "Explore prime attractions and historic sites.",
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

    // Updated model to gemini-2.0-flash
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.2,
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

    return NextResponse.json(itineraryData);
  } catch (error: any) {
    console.error("API Route Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate itinerary" },
      { status: 500 }
    );
  }
}