import { z } from 'zod';

export const createDeskSchema = z.object({
  label: z
    .string()
    .min(1, 'Desk label is required')
    .max(50, 'Desk label must be 50 characters or less'),
  zone_id: z.string().uuid('Invalid zone ID'),
  desk_type: z.enum(['standard', 'standing', 'private', 'shared']).default('standard'),
  status: z.enum(['available', 'maintenance', 'reserved']).default('available'),
  pos_x: z.coerce.number().default(0),
  pos_y: z.coerce.number().default(0),
  rotation: z.coerce.number().default(0),
  equipment: z.array(z.string()).default([]),
});

export const updateDeskSchema = z.object({
  label: z
    .string()
    .min(1, 'Desk label is required')
    .max(50, 'Desk label must be 50 characters or less')
    .optional(),
  zone_id: z.string().uuid('Invalid zone ID').optional(),
  desk_type: z.enum(['standard', 'standing', 'private', 'shared']).optional(),
  status: z.enum(['available', 'maintenance', 'reserved']).optional(),
  pos_x: z.coerce.number().optional(),
  pos_y: z.coerce.number().optional(),
  rotation: z.coerce.number().optional(),
  equipment: z.array(z.string()).optional(),
});

export type CreateDeskInput = z.infer<typeof createDeskSchema>;
export type UpdateDeskInput = z.infer<typeof updateDeskSchema>;
