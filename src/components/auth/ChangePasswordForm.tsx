'use client';

import { useActionState, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { changePassword } from '@/actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { KeyRound, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import zxcvbn from 'zxcvbn';
import { cn } from '@/lib/utils';

type ChangePasswordState = {
  success: boolean;
  error?: string;
} | null;

async function changePasswordAction(
  _prevState: ChangePasswordState,
  formData: FormData
): Promise<ChangePasswordState> {
  const newPassword = formData.get('newPassword') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  if (newPassword.length < 12) {
    return { success: false, error: 'Password must be at least 12 characters long.' };
  }

  if (newPassword !== confirmPassword) {
    return { success: false, error: 'Passwords do not match.' };
  }

  return changePassword(null, formData);
}

const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
const strengthColors = [
  'bg-red-500',
  'bg-orange-500',
  'bg-yellow-500',
  'bg-green-500',
  'bg-emerald-500',
];

export function ChangePasswordForm() {
  const [state, formAction, isPending] = useActionState(changePasswordAction, null);
  const [newPassword, setNewPassword] = useState('');
  const router = useRouter();

  const strength = newPassword.length > 0 ? zxcvbn(newPassword) : null;

  useEffect(() => {
    if (state?.success) {
      toast.success('Password changed successfully');
      router.push('/dashboard');
    }
  }, [state, router]);

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <KeyRound className="h-6 w-6" />
        </div>
        <CardTitle className="text-2xl">Change Password</CardTitle>
        <CardDescription>
          Please set a new password for your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          {state?.error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {state.error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <Input
              id="currentPassword"
              name="currentPassword"
              type="password"
              required
              autoComplete="current-password"
              placeholder="Enter current password"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              name="newPassword"
              type="password"
              required
              autoComplete="new-password"
              placeholder="Enter new password (min 12 characters)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            {strength && (
              <div className="space-y-1">
                <div className="flex gap-1">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={cn(
                        'h-1.5 flex-1 rounded-full transition-colors',
                        i <= strength.score
                          ? strengthColors[strength.score]
                          : 'bg-muted'
                      )}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {strengthLabels[strength.score]}
                </p>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              autoComplete="new-password"
              placeholder="Confirm new password"
            />
          </div>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Changing password...
              </>
            ) : (
              'Change Password'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
