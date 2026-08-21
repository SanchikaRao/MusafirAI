import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // --------------------------------------------------
    // USER INPUT — NOTHING IS HARD-CODED
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

    // Collect all configured Gemini API keys
    const apiKeys = [
      process.env.GEMINI_API_KEY,
      process.env.GEMINI_API_KEY_1,
      process.env.GEMINI_API_KEY_2,
      process.env.GEMINI_API_KEY_3,
    ].filter(Boolean) as string[];

    if (apiKeys.length === 0) {
      return NextResponse.json(
        {
          error: "GEMINI_API_KEY is missing.",
        },
        { status: 500 }
      );
    }

    // --------------------------------------------------
    // CALCULATE NUMBER OF DAYS
    // This is calculation, NOT travel hard-coding.
    // --------------------------------------------------

    const start = new Date(startDate);
    const end = new Date(endDate);

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
using ONLY the information supplied by the user and your own
knowledge/reasoning.

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

You are NOT restricted to any predefined destination.

The destination can be ANY city, town, region or country.

Do not assume the destination is a particular Indian city.

Do not assume the origin is a particular city.

Do not use predefined attractions.

Do not use predefined hotels.

Do not use predefined restaurants.

Do not use predefined routes.

Determine all travel information dynamically from the supplied
origin and destination.


TRAVEL PLANNING REQUIREMENTS:

1. Understand the geography between origin and destination.

2. Determine the most appropriate transportation option based on:
   - user preference
   - distance
   - practicality
   - approximate cost
   - travel time

3. If the user selected road travel, determine realistic roads,
   highways or routes appropriate for the actual origin and
   destination.

4. Recommend accommodation appropriate for the actual destination.

5. Recommend real attractions and experiences appropriate for the
   destination.

6. Do not invent obviously fictional tourist attractions.

7. Keep each day's activities geographically sensible so that the
   traveler does not unnecessarily travel back and forth.

8. Consider opening hours and realistic travel time where possible.

9. Consider the user's dietary preference.

10. Consider the user's travel pace.

11. Respect the user's total budget.

12. Estimate transportation, accommodation, food and activity costs.

13. Provide realistic latitude and longitude for locations.

14. Make each day meaningfully different.

15. If the destination has multiple neighborhoods/areas, organize
    activities geographically.

16. If the requested budget is unrealistic, clearly explain this
    through the budget notes while still creating the best possible
    itinerary.

17. Never replace the user's destination with another destination.

18. Never use information from a different city just because it is
    more famous.

19. The itinerary must contain EXACTLY ${numberOfDays} days.

20. Each day should contain multiple activities.

21. Use Indian Rupees for all costs unless the user explicitly
    requests another currency.

22. Generate the itinerary specifically for this user's trip.
`;


    // --------------------------------------------------
    // STRUCTURED JSON SCHEMA
    //
    // This defines ONLY the format.
    // Gemini generates ALL actual travel content.
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
    // CALL GEMINI WITH KEY ROTATION & RETRY
    // --------------------------------------------------

    const shuffledKeys = [...apiKeys].sort(() => Math.random() - 0.5);
    let data: any = null;
    let lastApiError: string = "";
const MODELS = ["gemini-3.6-flash", "gemini-2.5-flash", "gemini-2.0-flash"];

    for (const model of MODELS) {
      for (const key of shuffledKeys) {
        try {
          const response = await fetch(
            "https://generativelanguage.googleapis.com/v1beta/interactions",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-goog-api-key": key,
              },
              body: JSON.stringify({
                model: model,
                input: prompt,
                response_format: {
                  type: "text",
                  mime_type: "application/json",
                  schema: itinerarySchema,
                },
              }),
            }
          );

          if (response.ok) {
            data = await response.json();
            break;
          }

          const errResponse = await response.json().catch(() => ({}));
          lastApiError =
            errResponse?.error?.message ||
            `Gemini API error: ${response.status}`;

          if (response.status === 429) {
            console.warn(`Quota reached on ${model} with current key, trying next...`);
            continue;
          } else {
            break;
          }
        } catch (networkErr: any) {
          lastApiError = networkErr?.message || "Network error while calling Gemini.";
        }
      }
      if (data) break; // Stop loop once a successful response is received
    }

    if (!data) {
      return NextResponse.json(
        {
          error:
            lastApiError ||
            "Rate limit reached on all configured API keys. Please wait 30 seconds.",
        },
        { status: 429 }
      );
    }


    // --------------------------------------------------
    // GET MODEL TEXT
    // --------------------------------------------------

    let rawContent = "";

    if (typeof data?.output_text === "string") {
      rawContent = data.output_text;
    }

    if (!rawContent && Array.isArray(data?.steps)) {
      const modelStep = data.steps.find(
        (step: any) =>
          step?.type === "model_output"
      );

      if (modelStep?.content) {
        const textPart = modelStep.content.find(
          (part: any) =>
            part?.type === "text"
        );

        if (textPart?.text) {
          rawContent = textPart.text;
        }
      }
    }

    if (!rawContent && data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      rawContent = data.candidates[0].content.parts[0].text;
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

    let itinerary;

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
      !itinerary.days ||
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


    // --------------------------------------------------
    // RETURN AI RESULT AS-IS
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