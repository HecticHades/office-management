import { getSession } from '@/lib/auth/middleware';
import { redirect } from 'next/navigation';
import { getUsers } from '@/actions/admin';
import { UserList } from '@/components/admin/UserList';
import { CreateUserDialog } from '@/components/admin/CreateUserDialog';
import { Shield } from 'lucide-react';

export default async function AdminPage() {
  const session = await getSession();
  if (!session || session.user.role !== 'admin') redirect('/dashboard');

  const { users } = await getUsers();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="size-6 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          </div>
          <p className="text-muted-foreground mt-1">
            Manage user accounts, roles, and access.
          </p>
        </div>
        <CreateUserDialog />
      </div>
      <UserList users={users} />
    </div>
  );
}
