'use client';

import { useActionState, useEffect, useState } from 'react';
import { createZone, updateZone, getTeamsForSelect } from '@/actions/zones';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import type { Zone, Team } from '@/lib/db/types';

type ZoneFormProps = {
  zone?: Zone & { teams: Pick<Team, 'id' | 'name' | 'color'>[] };
  trigger: React.ReactNode;
};

type FormState = { success: boolean; error?: string } | null;

const ZONE_COLORS = [
  '#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6',
  '#ec4899', '#06b6d4', '#f97316', '#14b8a6', '#6366f1',
];

export function ZoneForm({ zone, trigger }: ZoneFormProps) {
  const [open, setOpen] = useState(false);
  const [teams, setTeams] = useState<Pick<Team, 'id' | 'name' | 'color'>[]>([]);
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>(
    zone?.teams?.map((t) => t.id) || []
  );
  const [selectedColor, setSelectedColor] = useState(zone?.color || '#3b82f6');

  async function formAction(_prev: FormState, formData: FormData): Promise<FormState> {
    formData.set('team_ids', selectedTeamIds.join(','));
    formData.set('color', selectedColor);

    if (zone) {
      return updateZone(zone.id, formData);
    }
    return createZone(formData);
  }

  const [state, action, isPending] = useActionState(formAction, null);

  useEffect(() => {
    if (open) {
      getTeamsForSelect().then(({ teams: t }) => setTeams(t));
      setSelectedTeamIds(zone?.teams?.map((t) => t.id) || []);
      setSelectedColor(zone?.color || '#3b82f6');
    }
  }, [open, zone]);

  useEffect(() => {
    if (state?.success) {
      toast.success(zone ? 'Zone updated successfully' : 'Zone created successfully');
      setOpen(false);
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state, zone]);

  function toggleTeam(teamId: string) {
    setSelectedTeamIds((prev) =>
      prev.includes(teamId)
        ? prev.filter((id) => id !== teamId)
        : [...prev, teamId]
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{zone ? 'Edit Zone' : 'Create Zone'}</DialogTitle>
        </DialogHeader>
        <form action={action} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              required
              defaultValue={zone?.name}
              placeholder="e.g., Engineering Wing"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={zone?.description || ''}
              placeholder="Optional description"
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="floor">Floor</Label>
              <Input
                id="floor"
                name="floor"
                type="number"
                required
                defaultValue={zone?.floor ?? 1}
                min={0}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="capacity">Capacity</Label>
              <Input
                id="capacity"
                name="capacity"
                type="number"
                required
                defaultValue={zone?.capacity ?? 10}
                min={1}
              />
            </div>
          </div>

          {/* Multi-team assignment */}
          <div className="space-y-2">
            <Label>Team Assignment</Label>
            {selectedTeamIds.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {selectedTeamIds.map((tid) => {
                  const team = teams.find((t) => t.id === tid);
                  if (!team) return null;
                  return (
                    <Badge
                      key={tid}
                      variant="secondary"
                      className="text-xs rounded-full gap-1 pr-1"
                      style={{
                        backgroundColor: `${team.color}15`,
                        color: team.color,
                        borderColor: `${team.color}30`,
                      }}
                    >
                      {team.name}
                      <button
                        type="button"
                        onClick={() => toggleTeam(tid)}
                        className="ml-0.5 rounded-full p-0.5 hover:bg-black/10"
                      >
                        <X className="size-3" />
                      </button>
                    </Badge>
                  );
                })}
              </div>
            )}
            <div className="max-h-[140px] overflow-y-auto rounded-lg border border-stone-200 divide-y divide-stone-100">
              {teams.length === 0 ? (
                <p className="text-xs text-stone-400 p-3 text-center">No teams available</p>
              ) : (
                teams.map((team) => (
                  <label
                    key={team.id}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-stone-50 cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedTeamIds.includes(team.id)}
                      onCheckedChange={() => toggleTeam(team.id)}
                    />
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: team.color }}
                    />
                    <span className="text-sm text-stone-700">{team.name}</span>
                  </label>
                ))
              )}
            </div>
            <p className="text-xs text-stone-400">
              Leave empty for an open zone (any user can book).
            </p>
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {ZONE_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className="h-8 w-8 rounded-full border-2 transition-transform hover:scale-110"
                  style={{
                    backgroundColor: color,
                    borderColor: selectedColor === color ? '#000' : 'transparent',
                  }}
                  onClick={() => setSelectedColor(color)}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
              className="border-stone-200"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} className="bg-teal-600 hover:bg-teal-700 text-white">
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {zone ? 'Updating...' : 'Creating...'}
                </>
              ) : zone ? (
                'Update Zone'
              ) : (
                'Create Zone'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
