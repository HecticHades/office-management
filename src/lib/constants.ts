export const ROLES = ['admin', 'team_lead', 'member'] as const;
export type UserRole = (typeof ROLES)[number];

export const TIME_SLOTS = ['morning', 'afternoon', 'full_day'] as const;
export type TimeSlot = (typeof TIME_SLOTS)[number];

export const TIME_SLOT_LABELS: Record<TimeSlot, string> = {
  morning: 'Morning (8:00 - 12:30)',
  afternoon: 'Afternoon (13:00 - 17:30)',
  full_day: 'Full Day (8:00 - 17:30)',
};

export const DESK_TYPES = ['standard', 'standing', 'private', 'shared'] as const;
export const DESK_STATUSES = ['available', 'maintenance', 'reserved'] as const;
export const BOOKING_STATUSES = ['confirmed', 'cancelled'] as const;

export const AUTH = {
  MAX_FAILED_ATTEMPTS: 10,
  LOCKOUT_DURATION_MINUTES: 30,
  SESSION_DURATION_DAYS: 7,
  TEMP_PASSWORD_EXPIRY_HOURS: 24,
  MIN_PASSWORD_LENGTH: 12,
  BCRYPT_SALT_ROUNDS: 12,
} as const;

export const RATE_LIMITS = {
  LOGIN: { maxAttempts: 5, windowMinutes: 15 },
  PASSWORD_CHANGE: { maxAttempts: 3, windowMinutes: 60 },
} as const;
