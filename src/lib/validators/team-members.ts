import { z } from 'zod';

export const addMemberSchema = z.object({
  team_id: z.string().uuid('Invalid team ID'),
  user_id: z.string().uuid('Invalid user ID'),
  role: z.enum(['lead', 'member']).default('member'),
});

export const updateMemberRoleSchema = z.object({
  role: z.enum(['lead', 'member']),
});

export type AddMemberInput = z.infer<typeof addMemberSchema>;
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
