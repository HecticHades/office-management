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
import { Badge } from '@/components/ui/badge';
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
  'bg-amber-500',
  'bg-teal-400',
  'bg-teal-600',
];
const strengthBadgeVariants: Array<'destructive' | 'outline' | 'secondary' | 'default'> = [
  'destructive',
  'destructive',
  'outline',
  'secondary',
  'default',
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
    <Card className="w-full max-w-md rounded-xl border-stone-200 shadow-lg">
      <CardHeader className="text-center pb-2 pt-8">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-600 text-white">
          <KeyRound className="h-7 w-7" />
        </div>
        <CardTitle className="text-3xl font-[family-name:var(--font-display)] tracking-tight">
          Update Your Password
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Please set a new password for your account
        </CardDescription>
      </CardHeader>
      <CardContent className="px-8 pb-8">
        <form action={formAction} className="space-y-5">
          {state?.error && (
            <div className="rounded-lg border-l-4 border-red-500 bg-red-50 p-3 text-sm text-red-700">
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
              className="h-11 border-stone-300 focus:ring-teal-500 focus:border-teal-500"
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
              className="h-11 border-stone-300 focus:ring-teal-500 focus:border-teal-500"
            />
            {strength && (
              <div className="space-y-2">
                <div className="flex gap-1">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={cn(
                        'h-2 flex-1 rounded-full transition-colors',
                        i <= strength.score
                          ? strengthColors[strength.score]
                          : 'bg-stone-200'
                      )}
                    />
                  ))}
                </div>
                <Badge variant={strengthBadgeVariants[strength.score]} className="text-xs">
                  {strengthLabels[strength.score]}
                </Badge>
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
              className="h-11 border-stone-300 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>
          <Button
            type="submit"
            className="w-full h-11 rounded-lg bg-teal-600 hover:bg-teal-700 text-white"
            disabled={isPending}
          >
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
