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
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and preferences
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Display Name</p>
              <p className="font-medium">{user.display_name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Username</p>
              <p className="font-medium">{user.username}</p>
            </div>
          </div>
          <Separator />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Role</p>
              <div className="flex items-center gap-2 mt-1">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <Badge variant="outline">{roleLabels[user.role] || user.role}</Badge>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Last Login</p>
              <div className="flex items-center gap-2 mt-1">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {user.last_login_at
                    ? new Date(user.last_login_at).toLocaleString()
                    : 'Never'}
                </span>
              </div>
            </div>
          </div>
          <Separator />
          <div>
            <p className="text-sm text-muted-foreground">Account Created</p>
            <p className="text-sm mt-1">
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
