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
        { error: "GEMINI_API_KEY is missing from environment variables." },
        { status: 500 }
      );
    }

    const d1 = new Date(startDate);
    const d2 = new Date(endDate);
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    const numDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);

    const prompt = `
      You are an expert AI travel planner for MusafirAI. Build a 100% verified, authentic day-wise travel itinerary for a real trip from ${origin} to ${destination}.

      TRIP PARAMETERS:
      - Origin: ${origin}
      - Destination: ${destination}
      - Duration: ${numDays} Days (${startDate} to ${endDate})
      - Travelers: ${groupSize} people
      - Total Budget Target: ₹${totalBudgetINR} INR
      - Preferred Transit: ${transportMode}
      - Dietary: ${dietary}

      CRITICAL: Return ONLY valid raw JSON matching this schema:
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
          "name": "Recommended Hotel in ${destination}",
          "rating": 4.6,
          "highlight": "Scenic views and verified amenities in central ${destination}"
        },
        "transitDetails": [
          {
            "mode": "${transportMode}",
            "name": "Route from ${origin} to ${destination}",
            "subtext": "Direct connection between ${origin} and ${destination}",
            "estimatedPriceINR": ${Math.round(totalBudgetINR * 0.25)},
            "highwaysOrRoads": ["Main Route"],
            "tips": "Book advance tickets for best pricing"
          }
        ],
        "days": [
          {
            "dayNumber": 1,
            "date": "${startDate}",
            "dayLabel": "Day 1",
            "theme": "Arrival & Initial Exploration",
            "aiReasoning": "Curated arrival flow with authentic local timing",
            "activities": [
              {
                "id": "act-1-1",
                "timeSlot": "10:00 AM",
                "title": "Iconic Landmark Visit",
                "description": "Explore prime attractions in ${destination}.",
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

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/interactions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          model: "gemini-3.6-flash",
          input: prompt,
          response_format: {
            type: "text",
            mime_type: "application/json",
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error?.message || `Google API returned status ${response.status}` },
        { status: response.status }
      );
    }

    // Comprehensive extractor across all Interactions API response shapes
    let rawText = "";

    if (typeof data.output_text === "string" && data.output_text.trim()) {
      rawText = data.output_text;
    } else if (Array.isArray(data.outputs)) {
      const lastOutput = data.outputs[data.outputs.length - 1];
      rawText = typeof lastOutput === "string" ? lastOutput : lastOutput?.text || "";
    } else if (Array.isArray(data.steps)) {
      for (let i = data.steps.length - 1; i >= 0; i--) {
        const step = data.steps[i];
        if (step.type === "model_output" || step.text || step.content) {
          rawText = step.text || step.content || "";
          break;
        }
      }
    } else if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
      rawText = data.candidates[0].content.parts[0].text;
    }

    // Clean JSON markdown wrappers if present
    let cleanJson = (rawText || "")
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```$/i, "")
      .trim();

    let itineraryData: any = {};

    try {
      itineraryData = JSON.parse(cleanJson);
    } catch {
      itineraryData = {};
    }

    // Safe fallbacks guarantee that no fields ever show "undefined"
    itineraryData.id = `${(destination || "trip").toLowerCase().replace(/\s+/g, "-")}-${Date.now().toString(36)}`;
    itineraryData.origin = itineraryData.origin || origin;
    itineraryData.destination = itineraryData.destination || destination;
    itineraryData.tripTitle = itineraryData.tripTitle || `${destination} Complete Itinerary`;
    itineraryData.groupSize = itineraryData.groupSize || Number(groupSize);
    itineraryData.transportMode = itineraryData.transportMode || transportMode;
    itineraryData.dietary = itineraryData.dietary || dietary;
    itineraryData.dateRangeLabel = itineraryData.dateRangeLabel || `${startDate} – ${endDate}`;

    if (!itineraryData.stay) {
      itineraryData.stay = {
        name: `Recommended Hotel in ${destination}`,
        rating: 4.6,
        highlight: `Centrally located accommodation in ${destination} with verified amenities.`,
      };
    }

    if (!itineraryData.transitDetails || !itineraryData.transitDetails.length) {
      itineraryData.transitDetails = [
        {
          mode: transportMode,
          name: `Route: ${origin} ➔ ${destination}`,
          subtext: `Direct connection connecting ${origin} to ${destination}`,
          estimatedPriceINR: Math.round(totalBudgetINR * 0.25),
        },
      ];
    }

    if (!itineraryData.budgetBreakdown) {
      itineraryData.budgetBreakdown = {
        transportCostINR: Math.round(totalBudgetINR * 0.25),
        stayCostINR: Math.round(totalBudgetINR * 0.45),
        foodAndActivitiesCostINR: Math.round(totalBudgetINR * 0.30),
        totalCostINR: Number(totalBudgetINR),
      };
    }

    return NextResponse.json(itineraryData, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to generate itinerary." },
      { status: 500 }
    );
  }
}