import { z } from 'zod';

export const createUserSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be 50 characters or less')
    .regex(/^[a-zA-Z0-9_.-]+$/, 'Username can only contain letters, numbers, dots, hyphens, and underscores'),
  display_name: z
    .string()
    .min(1, 'Display name is required')
    .max(100, 'Display name must be 100 characters or less'),
  role: z.enum(['admin', 'team_lead', 'member']).default('member'),
});

export const updateUserSchema = z.object({
  display_name: z
    .string()
    .min(1, 'Display name is required')
    .max(100, 'Display name must be 100 characters or less')
    .optional(),
  role: z.enum(['admin', 'team_lead', 'member']).optional(),
  is_active: z.boolean().optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
