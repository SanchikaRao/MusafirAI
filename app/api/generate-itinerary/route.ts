// app/api/generate-itinerary/route.ts
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
        { error: "GEMINI_API_KEY is not configured in Vercel Environment Variables." },
        { status: 500 }
      );
    }

    const d1 = new Date(startDate);
    const d2 = new Date(endDate);
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    const numDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);

    const prompt = `
      You are an expert AI travel planner for MusafirAI. Build a 100% verified, authentic, day-wise travel itinerary for a real trip from ${origin} to ${destination}.

      TRIP PARAMETERS:
      - Origin: ${origin}
      - Destination: ${destination}
      - Duration: ${numDays} Days (${startDate} to ${endDate})
      - Travelers: ${groupSize} people
      - Total Budget Target: ₹${totalBudgetINR} INR
      - Chosen Transit Mode: ${transportMode}
      - Dietary Preference: ${dietary}

      CRITICAL CONTENT REQUIREMENTS:
      - Use REAL, specific landmarks, verified restaurants, and real local activities in ${destination} (no generic placeholders like "Local Sightseeing").
      - Allocate realistic costs in INR for ${groupSize} travelers within ₹${totalBudgetINR}.
      - Return exactly ${numDays} day objects in the "days" array.

      Return ONLY valid JSON matching this schema:
      {
        "tripTitle": "${destination} Getaway",
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
          "name": "Specific Hotel / Resort Name in ${destination}",
          "rating": 4.6,
          "highlight": "Location highlights and verified amenities"
        },
        "transitDetails": [
          {
            "mode": "${transportMode}",
            "name": "Transit Connection",
            "subtext": "Direct travel route connecting ${origin} to ${destination}",
            "estimatedPriceINR": ${Math.round(totalBudgetINR * 0.25)},
            "highwaysOrRoads": ["Main Route / Corridor"],
            "tips": "Practical booking and timing advice"
          }
        ],
        "days": [
          {
            "dayNumber": 1,
            "date": "${startDate}",
            "dayLabel": "Day 1",
            "theme": "Arrival & Iconic Heritage",
            "aiReasoning": "Curated arrival flow with real local timing",
            "activities": [
              {
                "id": "act-1-1",
                "timeSlot": "10:00 AM",
                "title": "Specific Real Landmark",
                "description": "Authentic description of the landmark and visit tips",
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

    // Try Gemini 3.1 Pro Preview endpoint, falling back to Gemini 2.5 Flash if unavailable
    const targetModels = ["gemini-3.1-pro-preview", "gemini-2.5-flash", "gemini-1.5-flash"];
    let rawText = "";
    let apiError: any = null;

    for (const model of targetModels) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
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
        if (response.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
          rawText = data.candidates[0].content.parts[0].text;
          break;
        } else {
          apiError = data.error || { message: `Model ${model} returned status ${response.status}` };
        }
      } catch (err: any) {
        apiError = err;
      }
    }

    if (!rawText) {
      throw new Error(apiError?.message || "All Gemini model endpoints failed to respond.");
    }

    let rawJson = rawText
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```$/i, "")
      .trim();

    const itineraryData = JSON.parse(rawJson);
    itineraryData.id = `${(destination || "trip").toLowerCase().replace(/\s+/g, "-")}-${Date.now().toString(36)}`;

    return NextResponse.json(itineraryData, { status: 200 });
  } catch (error: any) {
    console.error("API Route Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate live itinerary." },
      { status: 500 }
    );
  }
}