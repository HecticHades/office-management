'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { createUser } from '@/actions/admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UserPlus, Copy, Check, Loader2 } from 'lucide-react';

export function CreateUserDialog() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createUser(formData);
      if (result.success && result.tempPassword) {
        setTempPassword(result.tempPassword);
        toast.success('User created successfully');
      } else {
        toast.error(result.error ?? 'Failed to create user');
      }
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
    setOpen(false);
    setTempPassword(null);
    setCopied(false);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : handleClose())}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="size-4" />
          Create User
        </Button>
      </DialogTrigger>
      <DialogContent>
        {tempPassword ? (
          <>
            <DialogHeader>
              <DialogTitle>User Created</DialogTitle>
              <DialogDescription>
                The user has been created with a temporary password. Share this
                password securely with the user. They will be required to change
                it on first login.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <Label>Temporary Password</Label>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded-md bg-muted px-3 py-2 font-mono text-sm">
                  {tempPassword}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopy}
                >
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
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription>
                Add a new user to the system. They will receive a temporary
                password.
              </DialogDescription>
            </DialogHeader>
            <form action={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  name="username"
                  required
                  placeholder="e.g. john.doe"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="display_name">Display Name</Label>
                <Input
                  id="display_name"
                  name="display_name"
                  required
                  placeholder="e.g. John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select name="role" defaultValue="member">
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="team_lead">Team Lead</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create User'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
