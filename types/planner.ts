export type GroupType = 'solo' | 'couple' | 'friends' | 'family';
export type BudgetTier = 'budget' | 'comfort' | 'luxury';
export type DietaryPreference = 'pure_veg' | 'jain' | 'halal' | 'any';
export type TransitPreference = 'train' | 'bus' | 'flight' | 'cab';

export interface TripFormData {
  origin: string;
  destination: string;
  startDate: string;
  endDate: string;
  groupSize: number;
  groupType: GroupType;
  totalBudgetINR: number;
  budgetTier: BudgetTier;
  dietary: DietaryPreference;
  pacing: 'relaxed' | 'moderate' | 'fast';
  transit: TransitPreference[];
  seniorFriendly: boolean;
}

export interface Activity {
  id: string;
  timeSlot: string;
  title: string;
  description: string;
  locationName: string;
  lat: number;
  lng: number;
  estimatedCostINR: number;
  category: 'sightseeing' | 'food' | 'transit' | 'stay';
}

export interface DayItinerary {
  dayNumber: number;
  date: string;
  theme: string;
  activities: Activity[];
  culturalAlert?: string;
}

export interface FullItinerary {
  id: string;
  destination: string;
  totalEstimatedCostINR: number;
  days: DayItinerary[];
}