import { z } from 'zod';

export const createZoneSchema = z.object({
  name: z
    .string()
    .min(1, 'Zone name is required')
    .max(100, 'Zone name must be 100 characters or less'),
  description: z
    .string()
    .max(500, 'Description must be 500 characters or less')
    .optional()
    .nullable(),
  floor: z.coerce.number().int().min(0, 'Floor must be 0 or higher').default(1),
  team_id: z.string().uuid('Invalid team ID').optional().nullable(),
  capacity: z.coerce.number().int().min(0, 'Capacity must be 0 or higher').default(0),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color')
    .default('#3B82F6'),
});

export const updateZoneSchema = z.object({
  name: z
    .string()
    .min(1, 'Zone name is required')
    .max(100, 'Zone name must be 100 characters or less')
    .optional(),
  description: z
    .string()
    .max(500, 'Description must be 500 characters or less')
    .optional()
    .nullable(),
  floor: z.coerce.number().int().min(0, 'Floor must be 0 or higher').optional(),
  team_id: z.string().uuid('Invalid team ID').optional().nullable(),
  capacity: z.coerce.number().int().min(0, 'Capacity must be 0 or higher').optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color')
    .optional(),
});

export type CreateZoneInput = z.infer<typeof createZoneSchema>;
export type UpdateZoneInput = z.infer<typeof updateZoneSchema>;
