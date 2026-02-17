'use client';

import { useActionState, useEffect, useState } from 'react';
import { createZone, updateZone, getTeamsForSelect } from '@/actions/zones';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
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
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Zone, Team } from '@/lib/db/types';

type ZoneFormProps = {
  zone?: Zone & { team?: Pick<Team, 'id' | 'name' | 'color'> };
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
  const [selectedTeam, setSelectedTeam] = useState(zone?.team_id || 'none');
  const [selectedColor, setSelectedColor] = useState(zone?.color || '#3b82f6');

  async function formAction(_prev: FormState, formData: FormData): Promise<FormState> {
    formData.set('team_id', selectedTeam);
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
    }
  }, [open]);

  useEffect(() => {
    if (state?.success) {
      toast.success(zone ? 'Zone updated successfully' : 'Zone created successfully');
      setOpen(false);
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state, zone]);

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
          <div className="space-y-2">
            <Label>Team Assignment</Label>
            <Select value={selectedTeam} onValueChange={setSelectedTeam}>
              <SelectTrigger>
                <SelectValue placeholder="No team (open zone)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No team (open zone)</SelectItem>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    <span className="flex items-center gap-2">
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: team.color }}
                      />
                      {team.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
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
