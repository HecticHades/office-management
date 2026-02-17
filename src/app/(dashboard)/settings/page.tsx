import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { ChangePasswordForm } from '@/components/auth/ChangePasswordForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { User, Shield, Clock } from 'lucide-react';

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const { user } = session;

  const roleLabels: Record<string, string> = {
    admin: 'Administrator',
    team_lead: 'Team Lead',
    member: 'Member',
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight text-stone-800">Settings</h1>
        <p className="text-stone-500 mt-1">
          Manage your account and preferences
        </p>
      </div>

      <Card className="rounded-xl border-stone-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-stone-800">
            <User className="h-5 w-5 text-stone-500" />
            Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-stone-400">Display Name</p>
              <p className="font-medium text-stone-800">{user.display_name}</p>
            </div>
            <div>
              <p className="text-sm text-stone-400">Username</p>
              <p className="font-medium text-stone-800">{user.username}</p>
            </div>
          </div>
          <Separator className="bg-stone-100" />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-stone-400">Role</p>
              <div className="flex items-center gap-2 mt-1">
                <Shield className="h-4 w-4 text-teal-600" />
                <Badge variant="outline" className="rounded-full border-teal-200 bg-teal-50 text-teal-700">{roleLabels[user.role] || user.role}</Badge>
              </div>
            </div>
            <div>
              <p className="text-sm text-stone-400">Last Login</p>
              <div className="flex items-center gap-2 mt-1">
                <Clock className="h-4 w-4 text-stone-400" />
                <span className="text-sm text-stone-600">
                  {user.last_login_at
                    ? new Date(user.last_login_at).toLocaleString()
                    : 'Never'}
                </span>
              </div>
            </div>
          </div>
          <Separator className="bg-stone-100" />
          <div>
            <p className="text-sm text-stone-400">Account Created</p>
            <p className="text-sm mt-1 text-stone-600">
              {new Date(user.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </CardContent>
      </Card>

      <ChangePasswordForm />
    </div>
  );
}
