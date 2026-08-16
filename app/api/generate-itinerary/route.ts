import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      origin = "Delhi",
      destination = "Manali",
      startDate = new Date().toISOString().split("T")[0],
      endDate = new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0],
      groupSize = 2,
      totalBudgetINR = 35000,
      transportMode = "flight",
      dietary = "vegetarian",
    } = body;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is missing from Vercel Environment Variables." },
        { status: 500 }
      );
    }

    const d1 = new Date(startDate);
    const d2 = new Date(endDate);
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    const numDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);

    const prompt = `
      You are an expert AI travel planner for MusafirAI. Build a 100% realistic, authentic day-wise travel itinerary for a real trip from ${origin} to ${destination}.

      TRIP PARAMETERS:
      - Origin: ${origin}
      - Destination: ${destination}
      - Duration: ${numDays} Days (${startDate} to ${endDate})
      - Travelers: ${groupSize} people
      - Total Budget Target: ₹${totalBudgetINR} INR
      - Preferred Transit Mode: ${transportMode}
      - Dietary Preference: ${dietary}

      STRICT INSTRUCTIONS:
      - Provide REAL, specific, and iconic landmark names, authentic cafes/restaurants, and activities in ${destination} (do not use generic terms like "Visit Landmark").
      - Distribute the ₹${totalBudgetINR} budget realistically across transport, stays, food, and activities.
      - Return valid JSON matching this schema exactly with no markdown formatting:

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
          "totalCostINR": ${Number(totalBudgetINR)}
        },
        "stay": {
          "name": "Recommended Hotel or Resort in ${destination}",
          "rating": 4.6,
          "highlight": "Scenic views, central location, verified amenities"
        },
        "transitDetails": [
          {
            "mode": "${transportMode}",
            "name": "Transit Route from ${origin} to ${destination}",
            "subtext": "Direct route connecting ${origin} to ${destination}",
            "estimatedPriceINR": ${Math.round(totalBudgetINR * 0.25)},
            "highwaysOrRoads": ["Main Route / Express Route"],
            "tips": "Book advance tickets for best pricing"
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
                "title": "Iconic Landmark Visit",
                "description": "Explore the primary attraction of ${destination}.",
                "locationName": "${destination}",
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

    // Direct REST API call — No external npm dependencies required
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.3,
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API Error details:", data);
      return NextResponse.json(
        { error: data.error?.message || "Gemini API rejected the request." },
        { status: response.status }
      );
    }

    let rawJson = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    rawJson = rawJson
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```$/i, "")
      .trim();

    const itineraryData = JSON.parse(rawJson);
    itineraryData.id = `${(destination || "trip").toLowerCase().replace(/\s+/g, "-")}-${Date.now().toString(36)}`;

    return NextResponse.json(itineraryData);
  } catch (error: any) {
    console.error("Server API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process live itinerary." },
      { status: 500 }
    );
  }
}