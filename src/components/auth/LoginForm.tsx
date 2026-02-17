'use client';

import { useActionState } from 'react';
import { login } from '@/actions/auth';
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
import { Building2, Loader2 } from 'lucide-react';

type LoginState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
} | null;

async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  // login() calls redirect() on success, so it only returns on error
  return login(null, formData);
}

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, null);

  return (
    <Card className="w-full max-w-md rounded-xl border-stone-200 shadow-lg">
      <CardHeader className="text-center pb-2 pt-8">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-600 text-white">
          <Building2 className="h-7 w-7" />
        </div>
        <CardTitle className="text-3xl font-[family-name:var(--font-display)] italic tracking-tight">
          OfficeSpace
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Sign in to your workspace
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
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              name="username"
              type="text"
              required
              autoComplete="username"
              autoFocus
              placeholder="Enter your username"
              className="h-11 border-stone-300 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="Enter your password"
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
                Signing in...
              </>
            ) : (
              'Sign in'
            )}
          </Button>
        </form>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Managed by your administrator
        </p>
      </CardContent>
    </Card>
  );
}
