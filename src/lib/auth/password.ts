import bcrypt from 'bcryptjs';
import zxcvbn from 'zxcvbn';
import { randomBytes } from 'crypto';
import { AUTH } from '@/lib/constants';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, AUTH.BCRYPT_SALT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function validatePasswordStrength(
  password: string,
  username: string
): { valid: boolean; score: number; feedback: string[] } {
  const feedback: string[] = [];

  if (password.length < AUTH.MIN_PASSWORD_LENGTH) {
    feedback.push(
      `Password must be at least ${AUTH.MIN_PASSWORD_LENGTH} characters long.`
    );
  }

  if (
    username &&
    password.toLowerCase().includes(username.toLowerCase())
  ) {
    feedback.push('Password must not contain your username.');
  }

  const result = zxcvbn(password, [username]);
  const score = result.score;

  if (score < 3) {
    if (result.feedback.warning) {
      feedback.push(result.feedback.warning);
    }
    feedback.push(...result.feedback.suggestions);
  }

  const valid = feedback.length === 0 && score >= 3;

  return { valid, score, feedback };
}

export function generateTempPassword(): string {
  return randomBytes(12).toString('base64url').slice(0, 16);
}
