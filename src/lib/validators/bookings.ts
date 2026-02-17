import { z } from 'zod';

export const createBookingSchema = z.object({
  desk_id: z.string().uuid('Invalid desk ID'),
  user_id: z.string().uuid('Invalid user ID'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  time_slot: z.enum(['morning', 'afternoon', 'full_day']).default('full_day'),
  notes: z
    .string()
    .max(500, 'Notes must be 500 characters or less')
    .optional()
    .nullable(),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
