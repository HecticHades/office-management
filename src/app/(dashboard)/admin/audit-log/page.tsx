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
        <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight text-stone-800">Audit Log</h1>
        <p className="text-stone-500 mt-1">
          Review authentication and administrative actions.
        </p>
      </div>
      <AuditLog initialLogs={logs} initialTotal={total} />
    </div>
  );
}
