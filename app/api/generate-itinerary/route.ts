````ts
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

// ============================================================
// CONFIG
// ============================================================

const MODEL =
  process.env.GEMINI_MODEL || "gemini-3.7-flash";

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/interactions";

const REQUEST_TIMEOUT_MS = 55_000;

// Only retry temporary server/rate-limit errors.
// DO NOT retry daily/free-tier quota exhaustion.
const MAX_RETRIES = 3;

// ============================================================
// TYPES
// ============================================================

type TripRequest = {
  origin: string;
  destination: string;
  startDate: string;
  endDate: string;
  groupSize: number;
  totalBudgetINR: number;
  transportMode?: string;
  dietary?: string;
  pace?: string;
};

type GeminiErrorResponse = {
  error?: {
    code?: number;
    message?: string;
    status?: string;
    details?: unknown[];
  };
};

type Itinerary = {
  id: string;
  tripTitle: string;
  origin: string;
  destination: string;
  dateRangeLabel: string;
  groupSize: number;
  transportMode: string;
  dietary: string;

  budgetBreakdown: {
    transportCostINR: number;
    stayCostINR: number;
    foodAndActivitiesCostINR: number;
    totalCostINR: number;
    budgetNotes: string;
  };

  stay: {
    name: string;
    rating: number;
    highlight: string;
    lat: number;
    lng: number;
    pricePerNightINR: number;
    reasonForSelection: string;
  };

  transitDetails: Array<{
    mode: string;
    name: string;
    subtext: string;
    routeNumber: string;
    estimatedPriceINR: number;
    estimatedDuration: string;
    highwaysOrRoads: string[];
    tips: string;
  }>;

  days: Array<{
    dayNumber: number;
    date: string;
    dayLabel: string;
    theme: string;
    aiReasoning: string;

    activities: Array<{
      id: string;
      timeSlot: string;
      title: string;
      description: string;
      locationName: string;
      lat: number;
      lng: number;
      estimatedCostINR: number;
      category: string;
      duration: string;
      travelToNext: string;
    }>;
  }>;
};

// ============================================================
// HELPERS
// ============================================================

function jsonError(
  message: string,
  status: number,
  extra?: Record<string, unknown>
) {
  return NextResponse.json(
    {
      error: message,
      ...extra,
    },
    { status }
  );
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getRetryAfterMs(response: Response): number | null {
  const retryAfter = response.headers.get("retry-after");

  if (!retryAfter) {
    return null;
  }

  // Retry-After can be seconds.
  const seconds = Number(retryAfter);

  if (Number.isFinite(seconds)) {
    return Math.max(0, seconds * 1000);
  }

  // Or it can theoretically be an HTTP date.
  const date = Date.parse(retryAfter);

  if (!Number.isNaN(date)) {
    return Math.max(0, date - Date.now());
  }

  return null;
}

function isQuotaError(
  status: number,
  message: string,
  errorStatus?: string
) {
  const text =
    `${message} ${errorStatus || ""}`.toLowerCase();

  return (
    status === 429 &&
    (
      text.includes("quota") ||
      text.includes("free_tier") ||
      text.includes("free tier") ||
      text.includes("quota_exceeded") ||
      text.includes("resource_exhausted")
    )
  );
}

function isRetryableError(
  status: number,
  message: string,
  errorStatus?: string
) {
  const text =
    `${message} ${errorStatus || ""}`.toLowerCase();

  // Daily/free-tier quota exhaustion should NOT be retried.
  if (isQuotaError(status, message, errorStatus)) {
    return false;
  }

  // Temporary rate limiting.
  if (status === 429) {
    return (
      text.includes("rate_limit") ||
      text.includes("rate limit") ||
      text.includes("too many requests")
    );
  }

  // Temporary Google server problems.
  if (
    status === 500 ||
    status === 502 ||
    status === 503 ||
    status === 504
  ) {
    return true;
  }

  return false;
}

function calculateNumberOfDays(
  startDate: string,
  endDate: string
) {
  // Parse YYYY-MM-DD as UTC to avoid timezone/DST issues.
  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime())
  ) {
    return null;
  }

  const difference =
    end.getTime() - start.getTime();

  return (
    Math.floor(
      difference / (1000 * 60 * 60 * 24)
    ) + 1
  );
}

function extractModelText(data: any): string {
  // Current Interactions API / SDK-compatible field.
  if (
    typeof data?.output_text === "string" &&
    data.output_text.trim()
  ) {
    return data.output_text.trim();
  }

  // Current REST response structure.
  if (Array.isArray(data?.steps)) {
    const modelSteps = data.steps.filter(
      (step: any) =>
        step?.type === "model_output"
    );

    for (const step of modelSteps.reverse()) {
      if (!Array.isArray(step?.content)) {
        continue;
      }

      const textPart = step.content.find(
        (part: any) =>
          part?.type === "text" &&
          typeof part?.text === "string"
      );

      if (textPart?.text?.trim()) {
        return textPart.text.trim();
      }
    }
  }

  // Backwards compatibility.
  if (
    Array.isArray(data?.outputs)
  ) {
    for (const output of data.outputs.reverse()) {
      if (
        output?.type === "text" &&
        typeof output?.text === "string"
      ) {
        return output.text.trim();
      }
    }
  }

  // Legacy GenerateContent-style response.
  if (
    typeof data?.candidates?.[0]?.content?.parts?.[0]?.text ===
      "string"
  ) {
    return data.candidates[0].content.parts[0].text.trim();
  }

  return "";
}

function cleanJsonText(text: string) {
  return text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
}

// ============================================================
// JSON SCHEMA
// ============================================================

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

// ============================================================
// BASIC ITINERARY VALIDATION
// ============================================================

function validateItinerary(
  itinerary: any,
  request: TripRequest,
  numberOfDays: number
): string | null {
  if (!itinerary || typeof itinerary !== "object") {
    return "AI returned an invalid itinerary.";
  }

  if (
    !Array.isArray(itinerary.days)
  ) {
    return "AI did not return a valid daily itinerary.";
  }

  if (
    itinerary.days.length !== numberOfDays
  ) {
    return `AI returned ${itinerary.days.length} days instead of the requested ${numberOfDays}.`;
  }

  if (
    String(itinerary.origin)
      .trim()
      .toLowerCase() !==
    request.origin.trim().toLowerCase()
  ) {
    return "AI changed the requested origin.";
  }

  if (
    String(itinerary.destination)
      .trim()
      .toLowerCase() !==
    request.destination.trim().toLowerCase()
  ) {
    return "AI changed the requested destination.";
  }

  if (
    Number(itinerary.groupSize) !==
    Number(request.groupSize)
  ) {
    return "AI returned an incorrect group size.";
  }

  for (
    let index = 0;
    index < itinerary.days.length;
    index++
  ) {
    const day = itinerary.days[index];

    if (
      Number(day?.dayNumber) !==
      index + 1
    ) {
      return `Invalid day number at day ${index + 1}.`;
    }

    if (
      !Array.isArray(day?.activities) ||
      day.activities.length === 0
    ) {
      return `Day ${index + 1} contains no activities.`;
    }
  }

  return null;
}

// ============================================================
// POST
// ============================================================

export async function POST(
  req: NextRequest
) {
  try {
    // --------------------------------------------------------
    // READ REQUEST
    // --------------------------------------------------------

    let body: Partial<TripRequest>;

    try {
      body = await req.json();
    } catch {
      return jsonError(
        "Invalid request body.",
        400
      );
    }

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

    // --------------------------------------------------------
    // VALIDATION
    // --------------------------------------------------------

    if (
      typeof origin !== "string" ||
      !origin.trim()
    ) {
      return jsonError(
        "Origin is required.",
        400
      );
    }

    if (
      typeof destination !== "string" ||
      !destination.trim()
    ) {
      return jsonError(
        "Destination is required.",
        400
      );
    }

    if (
      typeof startDate !== "string" ||
      !startDate.trim()
    ) {
      return jsonError(
        "Start date is required.",
        400
      );
    }

    if (
      typeof endDate !== "string" ||
      !endDate.trim()
    ) {
      return jsonError(
        "End date is required.",
        400
      );
    }

    if (
      typeof groupSize !== "number" ||
      !Number.isInteger(groupSize) ||
      groupSize < 1 ||
      groupSize > 50
    ) {
      return jsonError(
        "Group size must be a whole number between 1 and 50.",
        400
      );
    }

    if (
      typeof totalBudgetINR !== "number" ||
      !Number.isFinite(totalBudgetINR) ||
      totalBudgetINR <= 0
    ) {
      return jsonError(
        "Total budget must be a positive number.",
        400
      );
    }

    // --------------------------------------------------------
    // CALCULATE DAYS
    // --------------------------------------------------------

    const numberOfDays =
      calculateNumberOfDays(
        startDate,
        endDate
      );

    if (
      numberOfDays === null
    ) {
      return jsonError(
        "Invalid start or end date.",
        400
      );
    }

    if (numberOfDays <= 0) {
      return jsonError(
        "End date must be on or after the start date.",
        400
      );
    }

    // Prevent enormous AI requests.
    if (numberOfDays > 30) {
      return jsonError(
        "Trips longer than 30 days are not currently supported.",
        400
      );
    }

    // --------------------------------------------------------
    // GEMINI API KEY
    // --------------------------------------------------------

    const apiKey =
      process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error(
        "GEMINI_API_KEY is missing."
      );

      return jsonError(
        "AI service is not configured.",
        500
      );
    }

    // --------------------------------------------------------
    // USER REQUEST OBJECT
    // --------------------------------------------------------

    const tripRequest: TripRequest = {
      origin: origin.trim(),
      destination: destination.trim(),
      startDate: startDate.trim(),
      endDate: endDate.trim(),
      groupSize,
      totalBudgetINR,
      transportMode:
        typeof transportMode === "string"
          ? transportMode.trim()
          : "",
      dietary:
        typeof dietary === "string"
          ? dietary.trim()
          : "",
      pace:
        typeof pace === "string"
          ? pace.trim()
          : "moderate",
    };

    // --------------------------------------------------------
    // PROMPT
    // --------------------------------------------------------

    const prompt = `
You are MusafirAI, an expert AI travel planner.

Create a complete, realistic and personalized travel itinerary
for THIS EXACT USER TRIP.

==================================================
USER TRIP
==================================================

Origin:
${tripRequest.origin}

Destination:
${tripRequest.destination}

Start Date:
${tripRequest.startDate}

End Date:
${tripRequest.endDate}

Number of Days:
${numberOfDays}

Travelers:
${tripRequest.groupSize}

Total Budget:
₹${tripRequest.totalBudgetINR} INR

Transportation Preference:
${tripRequest.transportMode || "Choose the most suitable option"}

Dietary Preference:
${tripRequest.dietary || "No specific preference"}

Travel Pace:
${tripRequest.pace || "moderate"}

==================================================
DESTINATION RULES
==================================================

The destination can be ANY city, town, region or country.

Do NOT assume:
- the destination is a particular Indian city
- the origin is a particular city
- the user is traveling only within India

Never replace the user's destination.

Never replace the user's origin.

Do not use predefined attractions.

Do not use predefined hotels.

Do not use predefined restaurants.

Do not use predefined routes.

Determine recommendations dynamically from the supplied trip.

==================================================
TRAVEL PLANNING
==================================================

1. Understand the geography between the origin and destination.

2. Determine the most appropriate transportation option based on:
   - user preference
   - distance
   - practicality
   - approximate cost
   - travel time

3. If road travel is selected, provide realistic major roads,
   highways or routes where you are reasonably confident.

4. Recommend accommodation appropriate for the destination.

5. Recommend real attractions and experiences appropriate for
   the destination.

6. Never invent obviously fictional tourist attractions.

7. Keep each day's activities geographically sensible.

8. Avoid unnecessary backtracking.

9. Consider realistic travel time between activities.

10. Consider opening hours where reasonably known.

11. Respect the user's dietary preference.

12. Respect the user's travel pace.

13. Respect the user's total budget as closely as possible.

14. Estimate transportation, accommodation, food and activity costs.

15. Use realistic latitude and longitude for locations.

16. Make each day meaningfully different.

17. If the destination contains multiple neighborhoods or areas,
    organize activities geographically.

18. If the requested budget is unrealistic, explain this clearly
    in budgetNotes while still creating the best possible itinerary.

19. The itinerary MUST contain EXACTLY ${numberOfDays} days.

20. Each day MUST contain multiple activities.

21. Use Indian Rupees for all costs unless the user's trip clearly
    requires another currency.

22. Generate the itinerary specifically for this user's trip.

==================================================
IMPORTANT DATA HONESTY RULE
==================================================

Do not present uncertain information as guaranteed fact.

Prices, travel times, hotel prices and transport prices should be
treated as estimates unless you have reliable current information.

Use wording such as "estimated", "approximately", or "typically"
where appropriate.

Do not fabricate specific booking availability.

Do not fabricate exact departure times unless you have reliable
information.

==================================================
OUTPUT RULES
==================================================

Return ONLY valid JSON matching the supplied schema.

Do not include markdown.

Do not include explanations outside the JSON.

Do not wrap the JSON in triple backticks.

Make sure every required field is present.

Make sure the days array contains EXACTLY ${numberOfDays} items.

Day numbers MUST be:
1, 2, 3, ... ${numberOfDays}.
`;

    // --------------------------------------------------------
    // GEMINI REQUEST BODY
    // --------------------------------------------------------

    const requestBody = {
      model: MODEL,

      input: prompt,

      response_format: {
        type: "text",
        mime_type: "application/json",
        schema: itinerarySchema,
      },

      generation_config: {
        max_output_tokens: 16000,
      },
    };

    // --------------------------------------------------------
    // GEMINI CALL WITH SAFE RETRIES
    // --------------------------------------------------------

    let data: any = null;
    let lastErrorMessage =
      "Unable to generate itinerary.";

    for (
      let attempt = 0;
      attempt <= MAX_RETRIES;
      attempt++
    ) {
      const controller =
        new AbortController();

      const timeout = setTimeout(
        () => controller.abort(),
        REQUEST_TIMEOUT_MS
      );

      try {
        const response = await fetch(
          GEMINI_URL,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              "x-goog-api-key":
                apiKey,

              // Current Interactions API schema.
              "Api-Revision":
                "2026-05-20",
            },

            body: JSON.stringify(
              requestBody
            ),

            signal:
              controller.signal,
          }
        );

        clearTimeout(timeout);

        // ----------------------------------------------------
        // SUCCESS
        // ----------------------------------------------------

        if (response.ok) {
          data =
            await response.json();

          break;
        }

        // ----------------------------------------------------
        // ERROR RESPONSE
        // ----------------------------------------------------

        const errorBody =
          (await response
            .json()
            .catch(
              () => ({})
            )) as GeminiErrorResponse;

        const message =
          errorBody?.error?.message ||
          `Gemini API returned HTTP ${response.status}.`;

        const errorStatus =
          errorBody?.error?.status ||
          "";

        lastErrorMessage =
          message;

        console.error(
          "Gemini API error:",
          {
            status:
              response.status,

            errorStatus,

            attempt:
              attempt + 1,

            message,
          }
        );

        // ----------------------------------------------------
        // QUOTA EXHAUSTION
        // ----------------------------------------------------

        if (
          isQuotaError(
            response.status,
            message,
            errorStatus
          )
        ) {
          console.warn(
            "Gemini quota exhausted."
          );

          return jsonError(
            "MusafirAI has temporarily reached its AI usage limit. Please try again later.",
            429,
            {
              code:
                "AI_QUOTA_EXCEEDED",
            }
          );
        }

        // ----------------------------------------------------
        // NON-RETRYABLE ERROR
        // ----------------------------------------------------

        if (
          !isRetryableError(
            response.status,
            message,
            errorStatus
          )
        ) {
          if (
            response.status === 401 ||
            response.status === 403
          ) {
            return jsonError(
              "The AI service configuration is invalid. Please try again later.",
              500,
              {
                code:
                  "AI_CONFIGURATION_ERROR",
              }
            );
          }

          if (
            response.status === 400
          ) {
            return jsonError(
              "The AI service rejected the trip request.",
              400,
              {
                code:
                  "AI_BAD_REQUEST",
              }
            );
          }

          if (
            response.status === 404
          ) {
            return jsonError(
              "The configured AI model is unavailable.",
              500,
              {
                code:
                  "AI_MODEL_NOT_FOUND",
              }
            );
          }

          return jsonError(
            "The AI service could not process this trip right now.",
            502,
            {
              code:
                "AI_REQUEST_FAILED",
            }
          );
        }

        // ----------------------------------------------------
        // NO RETRIES LEFT
        // ----------------------------------------------------

        if (
          attempt >= MAX_RETRIES
        ) {
          break;
        }

        // ----------------------------------------------------
        // RETRY DELAY
        // ----------------------------------------------------

        const retryAfterMs =
          getRetryAfterMs(
            response
          );

        const exponentialDelay =
          Math.min(
            2000 *
              Math.pow(
                2,
                attempt
              ),
            10000
          );

        const jitter =
          Math.floor(
            Math.random() * 500
          );

        const delay =
          retryAfterMs ??
          exponentialDelay +
            jitter;

        console.warn(
          `Temporary Gemini error. Retrying in ${delay}ms...`
        );

        await sleep(delay);
      } catch (error: any) {
        clearTimeout(timeout);

        if (
          error?.name ===
          "AbortError"
        ) {
          lastErrorMessage =
            "The AI request timed out.";
        } else {
          lastErrorMessage =
            error?.message ||
            "Network error while contacting the AI service.";
        }

        console.error(
          "Gemini network error:",
          {
            attempt:
              attempt + 1,
            message:
              lastErrorMessage,
          }
        );

        if (
          attempt >= MAX_RETRIES
        ) {
          break;
        }

        const delay =
          Math.min(
            2000 *
              Math.pow(
                2,
                attempt
              ),
            10000
          ) +
          Math.floor(
            Math.random() * 500
          );

        await sleep(delay);
      }
    }

    // --------------------------------------------------------
    // NO GEMINI RESPONSE
    // --------------------------------------------------------

    if (!data) {
      return jsonError(
        "MusafirAI could not generate your itinerary right now. Please try again shortly.",
        502,
        {
          code:
            "AI_UNAVAILABLE",
        }
      );
    }

    // --------------------------------------------------------
    // EXTRACT MODEL TEXT
    // --------------------------------------------------------

    const rawContent =
      extractModelText(data);

    if (!rawContent) {
      console.error(
        "Gemini returned no model output:",
        JSON.stringify(
          data,
          null,
          2
        )
      );

      return jsonError(
        "The AI returned an empty itinerary. Please try again.",
        502,
        {
          code:
            "AI_EMPTY_RESPONSE",
        }
      );
    }

    // --------------------------------------------------------
    // PARSE JSON
    // --------------------------------------------------------

    let itinerary: Itinerary;

    try {
      const cleanJson =
        cleanJsonText(
          rawContent
        );

      itinerary =
        JSON.parse(
          cleanJson
        );
    } catch (error) {
      console.error(
        "Invalid Gemini JSON:",
        rawContent
      );

      return jsonError(
        "The AI returned an invalid itinerary. Please try again.",
        502,
        {
          code:
            "AI_INVALID_JSON",
        }
      );
    }

    // --------------------------------------------------------
    // VALIDATE ITINERARY
    // --------------------------------------------------------

    const validationError =
      validateItinerary(
        itinerary,
        tripRequest,
        numberOfDays
      );

    if (validationError) {
      console.error(
        "Itinerary validation failed:",
        validationError
      );

      return jsonError(
        "The AI generated an incomplete itinerary. Please try again.",
        502,
        {
          code:
            "AI_INVALID_ITINERARY",
        }
      );
    }

    // --------------------------------------------------------
    // NORMALIZE CRITICAL USER VALUES
    //
    // These are deterministic user inputs and should not be
    // allowed to silently change in the AI response.
    // --------------------------------------------------------

    itinerary.origin =
      tripRequest.origin;

    itinerary.destination =
      tripRequest.destination;

    itinerary.groupSize =
      tripRequest.groupSize;

    itinerary.transportMode =
      tripRequest.transportMode ||
      itinerary.transportMode;

    itinerary.dietary =
      tripRequest.dietary ||
      itinerary.dietary;

    // --------------------------------------------------------
    // RETURN
    // --------------------------------------------------------

    return NextResponse.json(
      itinerary,
      {
        status: 200,

        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  } catch (error: any) {
    console.error(
      "MusafirAI unexpected error:",
      error
    );

    return jsonError(
      "Something went wrong while generating your itinerary. Please try again.",
      500,
      {
        code:
          "INTERNAL_SERVER_ERROR",
      }
    );
  }
}
````
