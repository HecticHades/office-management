import { z } from 'zod';

export const createTeamSchema = z.object({
  name: z
    .string()
    .min(1, 'Team name is required')
    .max(100, 'Team name must be 100 characters or less'),
  description: z
    .string()
    .max(500, 'Description must be 500 characters or less')
    .optional()
    .nullable(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color')
    .default('#3B82F6'),
});

export const updateTeamSchema = z.object({
  name: z
    .string()
    .min(1, 'Team name is required')
    .max(100, 'Team name must be 100 characters or less')
    .optional(),
  description: z
    .string()
    .max(500, 'Description must be 500 characters or less')
    .optional()
    .nullable(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color')
    .optional(),
});

export type CreateTeamInput = z.infer<typeof createTeamSchema>;
export type UpdateTeamInput = z.infer<typeof updateTeamSchema>;
