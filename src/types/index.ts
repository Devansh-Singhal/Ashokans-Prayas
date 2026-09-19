export type TicketCategory = 
  | 'POTHOLE' 
  | 'GARBAGE_ACCUMULATION' 
  | 'STREETLIGHT' 
  | 'OPEN_DRAIN' 
  | 'FOOTPATH_DAMAGE' 
  | 'UNKNOWN';

export type TicketStatus = 
  | 'REPORTED' 
  | 'PROVISIONAL_FIX' 
  | 'RESOLVED' 
  | 'WEATHER_OCCLUDED';

export interface Ticket {
  id: string;
  category: TicketCategory;
  severity: number; // 1 - 5
  status: TicketStatus;
  upvotes: number;
  latitude: number;
  longitude: number;
  ward_id?: string;
  report_photo_url: string;
  resolution_photo_url?: string | null;
  is_commercial_adjacent?: boolean;
  address_hint?: string;
  created_at: string;
  resolved_at?: string | null;
}

export interface User {
  id: string;
  public_handle: string;
  phone_number: string;
  is_under_18: boolean;
  parent_phone_number?: string | null;
  consent_status: 'ACTIVE' | 'PENDING_PARENT_CONSENT';
  points_balance: number;
  verified_hours?: number;
  consent_token?: string;
}

export interface VerificationResult {
  message: string;
  credited_points: number;
  decay_percentage: number;
  pairing_count: number;
  ticket_status: TicketStatus;
  is_collusion_flagged?: boolean;
}

export interface WardScorecard {
  ward_id: string;
  total_tickets: number;
  resolved_count: number;
  active_count: number;
  avg_resolution_days: number;
  cleanliness_score: number; // 0 - 100
  recent_trend?: 'improving' | 'stable' | 'declining';
}

export interface DemoPersona {
  id: string;
  name: string;
  role: string;
  handle: string;
  phone: string;
  isUnder18: boolean;
  parentPhone?: string;
  points: number;
  avatarColor: string;
  description: string;
}
