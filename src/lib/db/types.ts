export type UserRole = 'admin' | 'team_lead' | 'member';
export type TeamMemberRole = 'lead' | 'member';
export type DeskType = 'standard' | 'standing' | 'private' | 'shared';
export type DeskStatus = 'available' | 'maintenance' | 'reserved';
export type BookingStatus = 'confirmed' | 'cancelled';
export type TimeSlot = 'morning' | 'afternoon' | 'full_day';

export interface User {
  id: string;
  username: string;
  display_name: string;
  password_hash: string;
  role: UserRole;
  is_active: boolean;
  must_change_password: boolean;
  failed_login_attempts: number;
  locked_until: string | null;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: string;
  created_at: string;
  ip_address: string | null;
  user_agent: string | null;
}

export interface TempPassword {
  id: string;
  user_id: string;
  password_hash: string;
  expires_at: string;
  used_at: string | null;
  created_by: string;
  created_at: string;
}

export interface AuthAuditLog {
  id: string;
  user_id: string | null;
  action: string;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

export interface Team {
  id: string;
  name: string;
  description: string | null;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: TeamMemberRole;
  joined_at: string;
}

export interface Zone {
  id: string;
  name: string;
  description: string | null;
  floor: number;
  team_id: string | null;
  capacity: number;
  boundary_path: string | null;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface Desk {
  id: string;
  label: string;
  zone_id: string;
  desk_type: DeskType;
  status: DeskStatus;
  pos_x: number;
  pos_y: number;
  rotation: number;
  equipment: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: string;
  desk_id: string;
  user_id: string;
  date: string;
  time_slot: TimeSlot;
  status: BookingStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/** User without the password_hash field, safe for client usage */
export type SafeUser = Omit<User, 'password_hash'>;
