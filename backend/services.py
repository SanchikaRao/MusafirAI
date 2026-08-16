import os
import json
import uuid
import re
from datetime import datetime
from dotenv import load_dotenv
from google import genai
from google.genai import types
from models import (
    TripRequest,
    FullItineraryResponse,
    DayItinerarySchema,
    ActivitySchema,
    BudgetBreakdownSchema,
    StaySummarySchema,
    TransitOptionSchema
)

load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()

def format_date_label(date_str: str) -> str:
    try:
        dt = datetime.strptime(date_str, "%Y-%m-%d")
        return dt.strftime("%b %d")
    except Exception:
        return date_str

def calculate_num_days(start_str: str, end_str: str) -> int:
    try:
        d1 = datetime.strptime(start_str, "%Y-%m-%d")
        d2 = datetime.strptime(end_str, "%Y-%m-%d")
        return max(1, (d2 - d1).days + 1)
    except Exception:
        return 3

def clean_json_string(text: str) -> str:
    text = re.sub(r'^```json\s*', '', text.strip(), flags=re.MULTILINE)
    text = re.sub(r'^```\s*', '', text.strip(), flags=re.MULTILINE)
    text = re.sub(r'```$', '', text.strip(), flags=re.MULTILINE)
    start = text.find('{')
    end = text.rfind('}')
    if start != -1 and end != -1:
        return text[start:end+1]
    return text.strip()

def parse_int_safely(val, default: int = 0) -> int:
    if val is None:
        return default
    if isinstance(val, (int, float)):
        return int(val)
    match = re.search(r'\d+', str(val).replace(',', ''))
    return int(match.group()) if match else default

def parse_float_safely(val, default: float = 0.0) -> float:
    if val is None:
        return default
    if isinstance(val, (int, float)):
        return float(val)
    match = re.search(r'[-+]?\d*\.?\d+', str(val))
    return float(match.group()) if match else default

async def build_itinerary_logic(req: TripRequest) -> FullItineraryResponse:
    dest = req.destination.strip().title()
    origin = req.origin.strip().title()
    num_days = calculate_num_days(req.startDate, req.endDate)
    dietary_label = req.dietary.replace("_", " ").title()

    start_formatted = format_date_label(req.startDate)
    end_formatted = format_date_label(req.endDate)
    date_range = f"{start_formatted} – {end_formatted}"

    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY is not set. Check backend/.env file.")

    client = genai.Client(api_key=GEMINI_API_KEY)

    prompt = f"""
    You are an expert AI travel planner and logistics advisor for MusafirAI. Build a 100% verified, authentic itinerary for {origin} to {dest}.

    TRIP CONSTRAINTS:
    - Route: {origin} to {dest}
    - Duration: {num_days} Days ({date_range})
    - Travelers: {req.groupSize}
    - Total Budget Target: ₹{req.totalBudgetINR} INR
    - Chosen Transit Mode: {req.transportMode}
    - Dietary Preference: {dietary_label}

    TRANSIT & ROUTE INSTRUCTIONS:
    Provide 2 to 3 real, verified transit options between {origin} and {dest} for the mode "{req.transportMode}":
    1. If FLIGHT: Include actual airline flight numbers & routes (e.g. IndiGo 6E-205), direct duration, and price.
    2. If TRAIN: Include real train names & numbers (e.g. 12780 Goa Express), travel time, boarding stations, and fare.
    3. If BUS: Include real operator names (e.g. Zingbus Premium AC, State Volvo), timings, and ticket cost.
    4. If CAR / CAB / SELF DRIVE: Include actual highway numbers (e.g. NH 48, Yamuna Expressway), key bypasses, road conditions, driving distance in km, and toll/fuel guidance in "highwaysOrRoads".

    DESTINATION & ITINERARY INSTRUCTIONS:
    1. Provide 1 premier hotel in {dest} with real rating and notable highlight.
    2. Budget breakdown for transport, stay, food & activities summing near ₹{req.totalBudgetINR}.
    3. For all {num_days} days, provide 3 to 4 real-world activities/landmarks in {dest} with accurate real latitude and longitude coordinates.
    4. Provide "aiReasoning" for every day explaining the pacing and {dietary_label} meal choices.

    REQUIRED JSON FORMAT:
    {{
      "tripTitle": "{dest} Getaway",
      "stay": {{
        "name": "Real Hotel Name in {dest}",
        "rating": 4.5,
        "highlight": "Scenic location in {dest}"
      }},
      "budgetBreakdown": {{
        "transportCostINR": {int(req.totalBudgetINR * 0.2)},
        "stayCostINR": {int(req.totalBudgetINR * 0.45)},
        "foodAndActivitiesCostINR": {int(req.totalBudgetINR * 0.35)},
        "totalCostINR": {req.totalBudgetINR}
      }},
      "transitDetails": [
        {{
          "mode": "{req.transportMode}",
          "name": "Route Details / Flight / Train / Highway Name",
          "subtext": "Timing and terminal/station details",
          "estimatedPriceINR": 2500,
          "highwaysOrRoads": ["NH 48"],
          "tips": "Route tip"
        }}
      ],
      "days": [
        {{
          "dayNumber": 1,
          "dayLabel": "{start_formatted}",
          "theme": "Arrival & Exploration",
          "aiReasoning": "Day 1 pacing details for {dest}...",
          "activities": [
            {{
              "timeSlot": "09:30 AM",
              "title": "Real Landmark Name in {dest}",
              "description": "Activity details.",
              "locationName": "Address in {dest}",
              "lat": 0.0,
              "lng": 0.0,
              "estimatedCostINR": 500,
              "category": "Sight",
              "iconType": "sight"
            }}
          ]
        }}
      ]
    }}
    Ensure all {num_days} days are provided completely.
    """

    candidate_models = [
        "gemini-3.6-flash",
        "gemini-3.5-flash",
        "gemini-3.7-flash",
        "gemini-3.5-flash-lite"
    ]
    response = None
    last_error = None

    for model_name in candidate_models:
        try:
            response = client.models.generate_content(
                model=model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.3
                )
            )
            if response and response.text:
                print(f"[Gemini AI] Succeeded with model: {model_name}")
                break
        except Exception as e:
            last_error = e
            print(f"[Gemini AI] Model '{model_name}' failed: {e}")
            continue

    if not response or not response.text:
        raise RuntimeError(f"All candidate models failed. Last error: {last_error}")

    raw_text = clean_json_string(response.text)
    data = json.loads(raw_text)

    # Transit parsing
    transit_list = []
    for opt in data.get("transitDetails", []):
        roads = opt.get("highwaysOrRoads") or []
        if isinstance(roads, str):
            roads = [roads]
        transit_list.append(
            TransitOptionSchema(
                mode=str(opt.get("mode") or req.transportMode),
                name=str(opt.get("name") or f"{req.transportMode.title()} Route to {dest}"),
                subtext=str(opt.get("subtext") or f"Direct connection between {origin} and {dest}"),
                estimatedPriceINR=parse_int_safely(opt.get("estimatedPriceINR"), 2500),
                highwaysOrRoads=[str(r) for r in roads],
                tips=str(opt.get("tips") or "Recommended route.")
            )
        )

    # Days & activities parsing
    days_list = []
    for d_idx, day_data in enumerate(data.get("days", [])):
        act_list = []
        for act in day_data.get("activities", []):
            act_list.append(
                ActivitySchema(
                    id=f"act-{uuid.uuid4().hex[:6]}",
                    timeSlot=str(act.get("timeSlot") or "09:30 AM"),
                    title=str(act.get("title") or f"Explore {dest}"),
                    description=str(act.get("description") or ""),
                    locationName=str(act.get("locationName") or dest),
                    lat=parse_float_safely(act.get("lat"), 0.0),
                    lng=parse_float_safely(act.get("lng"), 0.0),
                    estimatedCostINR=parse_int_safely(act.get("estimatedCostINR"), 500),
                    category=str(act.get("category") or "Sight"),
                    iconType=str(act.get("iconType") or "sight")
                )
            )

        days_list.append(
            DayItinerarySchema(
                dayNumber=parse_int_safely(day_data.get("dayNumber"), d_idx + 1),
                date=str(day_data.get("date") or f"Day {d_idx + 1}"),
                dayLabel=str(day_data.get("dayLabel") or f"Day {d_idx + 1}"),
                theme=str(day_data.get("theme") or f"{dest} Highlights"),
                aiReasoning=str(day_data.get("aiReasoning") or f"Paced schedule for {dest} with verified {dietary_label} dining."),
                activities=act_list
            )
        )

    stay_raw = data.get("stay", {})
    stay_obj = StaySummarySchema(
        name=str(stay_raw.get("name") or f"Top Stay in {dest}"),
        rating=parse_float_safely(stay_raw.get("rating"), 4.5),
        highlight=str(stay_raw.get("highlight") or f"Central location in {dest}")
    )

    budget_raw = data.get("budgetBreakdown", {})
    t_cost = parse_int_safely(budget_raw.get("transportCostINR"), int(req.totalBudgetINR * 0.2))
    s_cost = parse_int_safely(budget_raw.get("stayCostINR"), int(req.totalBudgetINR * 0.45))
    f_cost = parse_int_safely(budget_raw.get("foodAndActivitiesCostINR"), int(req.totalBudgetINR * 0.35))
    total_calc = t_cost + s_cost + f_cost if (t_cost + s_cost + f_cost) > 0 else req.totalBudgetINR

    budget_obj = BudgetBreakdownSchema(
        transportCostINR=t_cost if t_cost > 0 else int(req.totalBudgetINR * 0.2),
        stayCostINR=s_cost if s_cost > 0 else int(req.totalBudgetINR * 0.45),
        foodAndActivitiesCostINR=f_cost if f_cost > 0 else int(req.totalBudgetINR * 0.35),
        totalCostINR=total_calc
    )

    return FullItineraryResponse(
        id=f"{dest.lower().replace(' ', '-')}-{uuid.uuid4().hex[:6]}",
        tripTitle=str(data.get("tripTitle") or f"{dest} Getaway"),
        origin=origin,
        destination=dest,
        dateRangeLabel=date_range,
        groupSize=req.groupSize,
        transportMode=req.transportMode,
        dietary=dietary_label,
        budgetBreakdown=budget_obj,
        stay=stay_obj,
        transitDetails=transit_list,
        days=days_list
    )