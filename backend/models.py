from pydantic import BaseModel
from typing import List, Optional

class TripRequest(BaseModel):
    origin: str
    destination: str
    startDate: str
    endDate: str
    groupSize: int
    totalBudgetINR: int
    transportMode: str
    dietary: str

class ActivitySchema(BaseModel):
    id: str
    timeSlot: str
    title: str
    description: str
    locationName: str
    lat: float
    lng: float
    estimatedCostINR: int
    category: str
    iconType: str

class DayItinerarySchema(BaseModel):
    dayNumber: int
    date: str
    dayLabel: str
    theme: str
    aiReasoning: str
    activities: List[ActivitySchema]

class BudgetBreakdownSchema(BaseModel):
    transportCostINR: int
    stayCostINR: int
    foodAndActivitiesCostINR: int
    totalCostINR: int

class StaySummarySchema(BaseModel):
    name: str
    rating: float
    highlight: str

class TransitOptionSchema(BaseModel):
    mode: str
    name: str
    subtext: str
    estimatedPriceINR: int
    highwaysOrRoads: Optional[List[str]] = []
    tips: Optional[str] = ""

class FullItineraryResponse(BaseModel):
    id: str
    tripTitle: str
    origin: str
    destination: str
    dateRangeLabel: str
    groupSize: int
    transportMode: str
    dietary: str
    budgetBreakdown: BudgetBreakdownSchema
    stay: StaySummarySchema
    transitDetails: List[TransitOptionSchema]
    days: List[DayItinerarySchema]