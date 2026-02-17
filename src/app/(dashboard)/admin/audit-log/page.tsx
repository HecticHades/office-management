import { getSession } from '@/lib/auth/middleware';
import { redirect } from 'next/navigation';
import { getAuditLog } from '@/actions/admin';
import { AuditLog } from '@/components/admin/AuditLog';
import { ScrollText } from 'lucide-react';

export default async function AuditLogPage() {
  const session = await getSession();
  if (!session || session.user.role !== 'admin') redirect('/dashboard');

  const { logs, total } = await getAuditLog(1, 50);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <ScrollText className="size-6 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Audit Log</h1>
        </div>
        <p className="text-muted-foreground mt-1">
          Review authentication and administrative actions.
        </p>
      </div>
      <AuditLog initialLogs={logs} initialTotal={total} />
    </div>
  );
}
