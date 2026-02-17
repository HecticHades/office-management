'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import type { User } from '@/lib/db/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Copy, Check, Loader2, AlertTriangle } from 'lucide-react';

type ResetPasswordDialogProps = {
  user: User | null;
  tempPassword: string | null;
  onConfirm: (userId: string) => Promise<void>;
  onClose: () => void;
};

export function ResetPasswordDialog({
  user,
  tempPassword,
  onConfirm,
  onClose,
}: ResetPasswordDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);

  function handleConfirm() {
    if (!user) return;
    startTransition(async () => {
      await onConfirm(user.id);
    });
  }

  function handleCopy() {
    if (tempPassword) {
      navigator.clipboard.writeText(tempPassword);
      setCopied(true);
      toast.success('Password copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function handleClose() {
    setCopied(false);
    onClose();
  }

  return (
    <Dialog open={!!user} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent>
        {tempPassword ? (
          <>
            <DialogHeader>
              <DialogTitle>Password Reset</DialogTitle>
              <DialogDescription>
                The password for <strong>{user?.display_name}</strong> has been
                reset. Share this new temporary password securely.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <Label>New Temporary Password</Label>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded-md bg-muted px-3 py-2 font-mono text-sm">
                  {tempPassword}
                </code>
                <Button variant="outline" size="icon" onClick={handleCopy}>
                  {copied ? (
                    <Check className="size-4" />
                  ) : (
                    <Copy className="size-4" />
                  )}
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleClose}>Done</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Reset Password</DialogTitle>
              <DialogDescription>
                Are you sure you want to reset the password for{' '}
                <strong>{user?.display_name}</strong> ({user?.username})?
              </DialogDescription>
            </DialogHeader>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
              <div className="flex items-start gap-2 text-sm text-amber-700">
                <AlertTriangle className="size-4 mt-0.5 shrink-0" />
                <span>
                  This will generate a new temporary password and revoke all
                  active sessions for this user. They will be required to change
                  their password on next login.
                </span>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleClose} className="border-stone-200">
                Cancel
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={isPending}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                {isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  'Reset Password'
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
