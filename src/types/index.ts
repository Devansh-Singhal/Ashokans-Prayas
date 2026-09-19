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
  reporter_id?: string;
  report_photo_url: string;
  resolution_photo_url?: string | null;
  is_commercial_adjacent?: boolean;
  privacy_blur?: any[];
  address_hint?: string;
  created_at: string;
  resolved_at?: string | null;
  escrow_points?: number;
  needs_clarification?: boolean;
  duplicate_of?: string;
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
  is_transient?: boolean;
}

export interface WardScorecard {
  ward_id: string;
  total_tickets: number;
  resolved_count: number;
  active_count: number;
  avg_resolution_days: number;
  cleanliness_score: number; // 0 - 100
  recent_trend?: 'improving' | 'stable' | 'declining';
  trend?: {
    date: string;
    resolved: number;
    reported: number;
  }[];
}

export interface CivicTask {
  task_id: string;
  task_type: string;
  category: string;
  title: string;
  description: string;
  ward_id: string;
  status: string;
  earned_hours?: number;
  timestamp: string;
}

export interface GroupedDomain {
  domain_id: string;
  title: string;
  jurisdiction: string;
  icon: string;
  impact_metric: string;
  task_count: number;
  earned_hours?: number;
  verified_count?: number;
  tasks: CivicTask[];
}

export interface UserTasksResponse {
  user_id: string;
  public_handle: string;
  total_unique_tasks: number;
  total_verified_tasks?: number;
  citizens_safeguarded?: number;
  tasks: CivicTask[];
  grouped_domains: GroupedDomain[];
}

export interface CertificateData {
  certificate_id: string;
  verification_hash: string;
  issued_at: string;
  recipient: {
    user_id: string;
    name: string;
    public_handle: string;
    institution: string;
    academic_year: string;
  };
  summary: {
    total_tasks_completed: number;
    total_verified_tasks?: number;
    verified_civic_hours?: number;
    citizens_safeguarded: number;
    points_earned: number;
    status: string;
  };
  domains: {
    title: string;
    jurisdiction: string;
    task_count: number;
    earned_hours?: number;
    verified_count?: number;
    impact_metric: string;
    representative_tasks: string[];
  }[];
  authorities: {
    title: string;
    signatory: string;
    designation: string;
  }[];
  verification_url: string;
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
