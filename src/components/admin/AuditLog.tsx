'use client';

import { useState, useTransition } from 'react';
import { getAuditLog } from '@/actions/admin';
import { formatDateTime } from '@/lib/utils';
import type { AuthAuditLog } from '@/lib/db/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

type AuditLogEntry = AuthAuditLog & { username?: string };

const ACTION_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  login_success: { label: 'Login', variant: 'default' },
  login_failed: { label: 'Failed Login', variant: 'destructive' },
  logout: { label: 'Logout', variant: 'secondary' },
  create_user: { label: 'Create User', variant: 'default' },
  reset_password: { label: 'Reset Password', variant: 'secondary' },
  change_password: { label: 'Change Password', variant: 'secondary' },
  unlock_account: { label: 'Unlock', variant: 'default' },
  enable_user: { label: 'Enable User', variant: 'default' },
  disable_user: { label: 'Disable User', variant: 'destructive' },
  account_locked: { label: 'Account Locked', variant: 'destructive' },
};

function getActionBadge(action: string) {
  const config = ACTION_LABELS[action] ?? { label: action, variant: 'outline' as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

function formatDetails(details: Record<string, unknown> | null): string {
  if (!details) return '-';
  const entries = Object.entries(details)
    .filter(([, v]) => v !== null && v !== undefined)
    .map(([k, v]) => `${k}: ${v}`);
  return entries.length > 0 ? entries.join(', ') : '-';
}

type AuditLogProps = {
  initialLogs: AuditLogEntry[];
  initialTotal: number;
};

export function AuditLog({ initialLogs, initialTotal }: AuditLogProps) {
  const [logs, setLogs] = useState(initialLogs);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<string>('all');
  const [isPending, startTransition] = useTransition();
  const limit = 50;
  const totalPages = Math.ceil(total / limit);

  function loadPage(newPage: number) {
    startTransition(async () => {
      const result = await getAuditLog(newPage, limit);
      if (!result.error) {
        setLogs(result.logs);
        setTotal(result.total);
        setPage(newPage);
      }
    });
  }

  const filteredLogs =
    filter === 'all' ? logs : logs.filter((l) => l.action === filter);

  const uniqueActions = Array.from(new Set(logs.map((l) => l.action)));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            {uniqueActions.map((action) => (
              <SelectItem key={action} value={action}>
                {ACTION_LABELS[action]?.label ?? action}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">
          {total} total entries
        </span>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Details</TableHead>
              <TableHead>IP Address</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-24 text-center text-muted-foreground"
                >
                  No audit log entries found.
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-muted-foreground">
                    {formatDateTime(log.created_at)}
                  </TableCell>
                  <TableCell className="font-medium">
                    {log.username ?? '-'}
                  </TableCell>
                  <TableCell>{getActionBadge(log.action)}</TableCell>
                  <TableCell className="max-w-[300px] truncate text-muted-foreground text-xs font-mono">
                    {formatDetails(log.details)}
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono text-xs">
                    {log.ip_address ?? '-'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadPage(page - 1)}
              disabled={page <= 1 || isPending}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadPage(page + 1)}
              disabled={page >= totalPages || isPending}
            >
              {isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                'Next'
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
