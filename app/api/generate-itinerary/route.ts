import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // --------------------------------------------------
    // USER INPUT
    // --------------------------------------------------

    const {
      origin,
      destination,
      startDate,
      endDate,
      groupSize,
      totalBudgetINR,
      transportMode,
      dietary,
      pace,
    } = body;

    // --------------------------------------------------
    // VALIDATION
    // --------------------------------------------------

    if (!origin || !destination) {
      return NextResponse.json(
        {
          error: "Origin and destination are required.",
        },
        { status: 400 }
      );
    }

    if (!startDate || !endDate) {
      return NextResponse.json(
        {
          error: "Start date and end date are required.",
        },
        { status: 400 }
      );
    }

    if (!groupSize || !totalBudgetINR) {
      return NextResponse.json(
        {
          error: "Group size and budget are required.",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // GEMINI API KEY
    // --------------------------------------------------

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error: "GEMINI_API_KEY is missing.",
        },
        { status: 500 }
      );
    }

    // --------------------------------------------------
    // CALCULATE NUMBER OF DAYS
    // --------------------------------------------------

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime())
    ) {
      return NextResponse.json(
        {
          error: "Invalid start or end date.",
        },
        { status: 400 }
      );
    }

    const numberOfDays =
      Math.floor(
        (end.getTime() - start.getTime()) /
          (1000 * 60 * 60 * 24)
      ) + 1;

    if (numberOfDays <= 0) {
      return NextResponse.json(
        {
          error: "End date must be after start date.",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // LLM PROMPT
    // --------------------------------------------------

    const prompt = `
You are MusafirAI, an expert AI travel planner.

Create a complete, realistic and personalized travel itinerary
for the user's exact trip.

Use the user's supplied origin, destination, dates, travelers,
budget, transport preference, dietary preference and travel pace.

USER TRIP:

Origin:
${origin}

Destination:
${destination}

Start Date:
${startDate}

End Date:
${endDate}

Number of Days:
${numberOfDays}

Travelers:
${groupSize}

Total Budget:
₹${totalBudgetINR} INR

Transportation Preference:
${transportMode || "Choose the most suitable option"}

Dietary Preference:
${dietary || "No specific preference"}

Travel Pace:
${pace || "moderate"}

IMPORTANT:

The destination can be ANY city, town, region or country.

Do not assume a particular Indian city.

Do not assume a particular origin.

Do not replace the user's destination.

Do not use predefined attractions, hotels, restaurants,
routes or destinations.

Determine travel information dynamically from the supplied
origin and destination.

TRAVEL PLANNING REQUIREMENTS:

1. Understand the geography between origin and destination.

2. Determine an appropriate transportation option based on:
   - user preference
   - distance
   - practicality
   - approximate cost
   - travel time

3. If road travel is selected, provide realistic roads,
   highways or routes appropriate for the actual trip.

4. Recommend accommodation appropriate for the actual destination.

5. Recommend real attractions and experiences appropriate
   for the destination.

6. Do not invent obviously fictional tourist attractions.

7. Keep each day's activities geographically sensible.

8. Avoid unnecessary backtracking.

9. Consider realistic opening hours where possible.

10. Consider the user's dietary preference.

11. Consider the user's travel pace.

12. Respect the user's total budget.

13. Estimate transportation, accommodation, food and activity costs.

14. Provide realistic latitude and longitude for locations.

15. Make each day meaningfully different.

16. If the destination contains multiple neighborhoods or areas,
    organize activities geographically.

17. If the budget is unrealistic, explain this in budgetNotes
    while still creating the best possible itinerary.

18. Never replace the user's destination with another destination.

19. Never use information from another city just because it
    is more famous.

20. The itinerary MUST contain exactly ${numberOfDays} days.

21. Each day should contain multiple activities.

22. Use Indian Rupees for all costs.

23. Generate the itinerary specifically for this user's trip.

Return ONLY the structured JSON requested by the schema.
`;

    // --------------------------------------------------
    // STRUCTURED JSON SCHEMA
    // --------------------------------------------------

    const itinerarySchema = {
      type: "object",

      properties: {
        id: {
          type: "string",
        },

        tripTitle: {
          type: "string",
        },

        origin: {
          type: "string",
        },

        destination: {
          type: "string",
        },

        dateRangeLabel: {
          type: "string",
        },

        groupSize: {
          type: "integer",
        },

        transportMode: {
          type: "string",
        },

        dietary: {
          type: "string",
        },

        budgetBreakdown: {
          type: "object",

          properties: {
            transportCostINR: {
              type: "number",
            },

            stayCostINR: {
              type: "number",
            },

            foodAndActivitiesCostINR: {
              type: "number",
            },

            totalCostINR: {
              type: "number",
            },

            budgetNotes: {
              type: "string",
            },
          },

          required: [
            "transportCostINR",
            "stayCostINR",
            "foodAndActivitiesCostINR",
            "totalCostINR",
            "budgetNotes",
          ],
        },

        stay: {
          type: "object",

          properties: {
            name: {
              type: "string",
            },

            rating: {
              type: "number",
            },

            highlight: {
              type: "string",
            },

            lat: {
              type: "number",
            },

            lng: {
              type: "number",
            },

            pricePerNightINR: {
              type: "number",
            },

            reasonForSelection: {
              type: "string",
            },
          },

          required: [
            "name",
            "rating",
            "highlight",
            "lat",
            "lng",
            "pricePerNightINR",
            "reasonForSelection",
          ],
        },

        transitDetails: {
          type: "array",

          items: {
            type: "object",

            properties: {
              mode: {
                type: "string",
              },

              name: {
                type: "string",
              },

              subtext: {
                type: "string",
              },

              routeNumber: {
                type: "string",
              },

              estimatedPriceINR: {
                type: "number",
              },

              estimatedDuration: {
                type: "string",
              },

              highwaysOrRoads: {
                type: "array",

                items: {
                  type: "string",
                },
              },

              tips: {
                type: "string",
              },
            },

            required: [
              "mode",
              "name",
              "subtext",
              "routeNumber",
              "estimatedPriceINR",
              "estimatedDuration",
              "highwaysOrRoads",
              "tips",
            ],
          },
        },

        days: {
          type: "array",

          items: {
            type: "object",

            properties: {
              dayNumber: {
                type: "integer",
              },

              date: {
                type: "string",
              },

              dayLabel: {
                type: "string",
              },

              theme: {
                type: "string",
              },

              aiReasoning: {
                type: "string",
              },

              activities: {
                type: "array",

                items: {
                  type: "object",

                  properties: {
                    id: {
                      type: "string",
                    },

                    timeSlot: {
                      type: "string",
                    },

                    title: {
                      type: "string",
                    },

                    description: {
                      type: "string",
                    },

                    locationName: {
                      type: "string",
                    },

                    lat: {
                      type: "number",
                    },

                    lng: {
                      type: "number",
                    },

                    estimatedCostINR: {
                      type: "number",
                    },

                    category: {
                      type: "string",
                    },

                    duration: {
                      type: "string",
                    },

                    travelToNext: {
                      type: "string",
                    },
                  },

                  required: [
                    "id",
                    "timeSlot",
                    "title",
                    "description",
                    "locationName",
                    "lat",
                    "lng",
                    "estimatedCostINR",
                    "category",
                    "duration",
                    "travelToNext",
                  ],
                },
              },
            },

            required: [
              "dayNumber",
              "date",
              "dayLabel",
              "theme",
              "aiReasoning",
              "activities",
            ],
          },
        },
      },

      required: [
        "id",
        "tripTitle",
        "origin",
        "destination",
        "dateRangeLabel",
        "groupSize",
        "transportMode",
        "dietary",
        "budgetBreakdown",
        "stay",
        "transitDetails",
        "days",
      ],
    };

    // --------------------------------------------------
    // CALL GEMINI
    // SINGLE API KEY + LIMITED RETRY
    // --------------------------------------------------

    const MODEL = "gemini-3.1-flash-lite";

    let data: any = null;
    let lastApiError = "";

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await fetch(
          "https://generativelanguage.googleapis.com/v1beta/interactions",
          {
            method: "POST",

            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": apiKey,
            },

            body: JSON.stringify({
              model: MODEL,
              input: prompt,

              response_format: {
                type: "text",
                mime_type: "application/json",
                schema: itinerarySchema,
              },

              generation_config: {
                max_output_tokens: 12000,
              },
            }),
          }
        );

        // --------------------------------------------------
        // SUCCESS
        // --------------------------------------------------

        if (response.ok) {
          data = await response.json();
          break;
        }

        // --------------------------------------------------
        // API ERROR
        // --------------------------------------------------

        const errResponse = await response
          .json()
          .catch(() => ({}));

        lastApiError =
          errResponse?.error?.message ||
          `Gemini API error: ${response.status}`;

        // --------------------------------------------------
        // RATE LIMIT
        // --------------------------------------------------

        if (response.status === 429) {
          console.warn(
            "Gemini rate limit reached."
          );

          if (attempt === 0) {
            await new Promise((resolve) =>
              setTimeout(resolve, 4000)
            );

            continue;
          }

          return NextResponse.json(
            {
              code: "AI_QUOTA_EXCEEDED",
              error:
                "MusafirAI is temporarily out of AI capacity. Please try again later.",
              details: lastApiError,
            },
            { status: 429 }
          );
        }

        // --------------------------------------------------
        // OTHER API ERROR
        // --------------------------------------------------

        return NextResponse.json(
          {
            error: lastApiError,
          },
          { status: response.status >= 400 ? response.status : 500 }
        );
      } catch (networkErr: any) {
        lastApiError =
          networkErr?.message ||
          "Network error while calling Gemini.";

        if (attempt === 0) {
          await new Promise((resolve) =>
            setTimeout(resolve, 1500)
          );

          continue;
        }
      }
    }

    // --------------------------------------------------
    // NO RESPONSE
    // --------------------------------------------------

    if (!data) {
      return NextResponse.json(
        {
          error:
            lastApiError ||
            "Gemini did not return an itinerary.",
        },
        { status: 500 }
      );
    }

    // --------------------------------------------------
    // GET MODEL TEXT
    // --------------------------------------------------

    let rawContent = "";

    if (typeof data?.output_text === "string") {
      rawContent = data.output_text;
    }

    // Fallback for Interactions API step output
    if (!rawContent && Array.isArray(data?.steps)) {
      const modelStep = data.steps.find(
        (step: any) =>
          step?.type === "model_output"
      );

      if (Array.isArray(modelStep?.content)) {
        const textPart = modelStep.content.find(
          (part: any) =>
            part?.type === "text"
        );

        if (textPart?.text) {
          rawContent = textPart.text;
        }
      }
    }

    // Legacy/fallback response format
    if (
      !rawContent &&
      data?.candidates?.[0]?.content?.parts?.[0]?.text
    ) {
      rawContent =
        data.candidates[0].content.parts[0].text;
    }

    // --------------------------------------------------
    // SAFETY CHECK
    // --------------------------------------------------

    if (!rawContent) {
      console.error(
        "No model output:",
        JSON.stringify(data, null, 2)
      );

      return NextResponse.json(
        {
          error:
            "Gemini returned no itinerary.",
        },
        { status: 500 }
      );
    }

    // --------------------------------------------------
    // PARSE JSON
    // --------------------------------------------------

    let itinerary: any;

    try {
      const cleanJson = rawContent
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/```$/i, "")
        .trim();

      itinerary = JSON.parse(cleanJson);
    } catch (error) {
      console.error(
        "Invalid Gemini JSON:",
        rawContent
      );

      return NextResponse.json(
        {
          error:
            "Gemini returned invalid structured data.",
        },
        { status: 500 }
      );
    }

    // --------------------------------------------------
    // BASIC VALIDATION
    // --------------------------------------------------

    if (
      !itinerary ||
      !Array.isArray(itinerary.days)
    ) {
      return NextResponse.json(
        {
          error:
            "AI did not generate a valid daily itinerary.",
        },
        { status: 500 }
      );
    }

    // Make sure the model respected the requested
    // number of days.
    if (itinerary.days.length !== numberOfDays) {
      return NextResponse.json(
        {
          error:
            `AI generated ${itinerary.days.length} days instead of ${numberOfDays}. Please try again.`,
        },
        { status: 500 }
      );
    }

    // --------------------------------------------------
    // RETURN AI RESULT
    // --------------------------------------------------

    return NextResponse.json(
      itinerary,
      { status: 200 }
    );
  } catch (error: any) {
    console.error(
      "MusafirAI Error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error?.message ||
          "Failed to generate itinerary.",
      },
      { status: 500 }
    );
  }
}