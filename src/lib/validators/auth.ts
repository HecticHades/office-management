import { z } from 'zod';

export const loginSchema = z.object({
  username: z
    .string()
    .min(1, 'Username is required')
    .max(50, 'Username must be 50 characters or less'),
  password: z
    .string()
    .min(1, 'Password is required'),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(12, 'Password must be at least 12 characters'),
    confirmPassword: z
      .string()
      .min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
