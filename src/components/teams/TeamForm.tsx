'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { createTeam, updateTeam } from '@/actions/teams';
import type { Team } from '@/lib/db/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Loader2, Plus, Pencil } from 'lucide-react';

const PRESET_COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#22c55e', // green
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
];

type TeamFormProps = {
  team?: Team;
  trigger?: React.ReactNode;
};

export function TeamForm({ team, trigger }: TeamFormProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [color, setColor] = useState(team?.color ?? '#3b82f6');
  const isEditing = !!team;

  function handleSubmit(formData: FormData) {
    formData.set('color', color);
    startTransition(async () => {
      const result = isEditing
        ? await updateTeam(team.id, formData)
        : await createTeam(formData);
      if (result.success) {
        toast.success(isEditing ? 'Team updated' : 'Team created');
        setOpen(false);
      } else {
        toast.error(result.error ?? 'Something went wrong');
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button className="bg-teal-600 hover:bg-teal-700 text-white">
            {isEditing ? (
              <>
                <Pencil className="size-4" />
                Edit
              </>
            ) : (
              <>
                <Plus className="size-4" />
                Create Team
              </>
            )}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Team' : 'Create Team'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the team details.'
              : 'Create a new team to organize members.'}
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="team-name">Team Name</Label>
            <Input
              id="team-name"
              name="name"
              required
              defaultValue={team?.name}
              placeholder="e.g. Engineering"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="team-description">Description</Label>
            <Textarea
              id="team-description"
              name="description"
              defaultValue={team?.description ?? ''}
              placeholder="What does this team do?"
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex items-center gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="size-7 rounded-full border-2 transition-transform hover:scale-110"
                  style={{
                    backgroundColor: c,
                    borderColor: color === c ? 'currentColor' : 'transparent',
                  }}
                >
                  <span className="sr-only">{c}</span>
                </button>
              ))}
              <Input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-24 font-mono text-xs"
                maxLength={7}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="border-stone-200"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} className="bg-teal-600 hover:bg-teal-700 text-white">
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {isEditing ? 'Saving...' : 'Creating...'}
                </>
              ) : isEditing ? (
                'Save Changes'
              ) : (
                'Create Team'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
