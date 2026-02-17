'use client';

import { useState, useEffect, useTransition } from 'react';
import { toast } from 'sonner';
import { addMember, getAvailableUsers } from '@/actions/team-members';
import type { User } from '@/lib/db/types';
import { Button } from '@/components/ui/button';
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
import { UserPlus, Loader2 } from 'lucide-react';

type AddMemberDialogProps = {
  teamId: string;
};

export function AddMemberDialog({ teamId }: AddMemberDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [availableUsers, setAvailableUsers] = useState<
    Pick<User, 'id' | 'username' | 'display_name'>[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('member');

  useEffect(() => {
    if (open) {
      setLoading(true);
      getAvailableUsers(teamId).then((result) => {
        if (!result.error) {
          setAvailableUsers(result.users);
        }
        setLoading(false);
      });
    } else {
      setSelectedUserId('');
      setSelectedRole('member');
    }
  }, [open, teamId]);

  function handleSubmit() {
    if (!selectedUserId) {
      toast.error('Please select a user');
      return;
    }
    const formData = new FormData();
    formData.set('user_id', selectedUserId);
    formData.set('role', selectedRole);

    startTransition(async () => {
      const result = await addMember(teamId, formData);
      if (result.success) {
        toast.success('Member added to team');
        setOpen(false);
      } else {
        toast.error(result.error ?? 'Failed to add member');
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <UserPlus className="size-4" />
          Add Member
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Team Member</DialogTitle>
          <DialogDescription>
            Select a user to add to this team.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>User</Label>
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                <Loader2 className="size-4 animate-spin" />
                Loading users...
              </div>
            ) : availableUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">
                No available users to add.
              </p>
            ) : (
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.display_name} ({user.username})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="lead">Team Lead</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending || !selectedUserId}
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Adding...
              </>
            ) : (
              'Add Member'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
