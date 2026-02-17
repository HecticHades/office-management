'use client';

import { useActionState, useEffect, useState } from 'react';
import { createDesk, updateDesk } from '@/actions/desks';
import { getZones } from '@/actions/zones';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Loader2, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import type { Desk, Zone } from '@/lib/db/types';

type DeskFormProps = {
  desk?: Desk;
  zoneId?: string;
  trigger: React.ReactNode;
};

type FormState = { success: boolean; error?: string } | null;

const DESK_TYPES = [
  { value: 'standard', label: 'Standard' },
  { value: 'standing', label: 'Standing' },
  { value: 'private', label: 'Private' },
  { value: 'shared', label: 'Shared' },
];

const DESK_STATUSES = [
  { value: 'available', label: 'Available' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'reserved', label: 'Reserved' },
];

export function DeskForm({ desk, zoneId, trigger }: DeskFormProps) {
  const [open, setOpen] = useState(false);
  const [zones, setZones] = useState<Pick<Zone, 'id' | 'name'>[]>([]);
  const [selectedZone, setSelectedZone] = useState(desk?.zone_id || zoneId || '');
  const [selectedType, setSelectedType] = useState<string>(desk?.desk_type || 'standard');
  const [selectedStatus, setSelectedStatus] = useState<string>(desk?.status || 'available');
  const [equipment, setEquipment] = useState<string[]>(desk?.equipment ?? []);
  const [equipmentInput, setEquipmentInput] = useState('');

  async function formAction(_prev: FormState, formData: FormData): Promise<FormState> {
    formData.set('zone_id', selectedZone);
    formData.set('desk_type', selectedType);
    formData.set('status', selectedStatus);
    formData.set('equipment', equipment.join(','));

    if (desk) {
      return updateDesk(desk.id, formData);
    }
    return createDesk(formData);
  }

  const [state, action, isPending] = useActionState(formAction, null);

  useEffect(() => {
    if (open) {
      getZones().then(({ zones: z }) => setZones(z.map((zone) => ({ id: zone.id, name: zone.name }))));
    }
  }, [open]);

  useEffect(() => {
    if (state?.success) {
      toast.success(desk ? 'Desk updated successfully' : 'Desk created successfully');
      setOpen(false);
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state, desk]);

  function addEquipment() {
    const item = equipmentInput.trim();
    if (item && !equipment.includes(item)) {
      setEquipment([...equipment, item]);
      setEquipmentInput('');
    }
  }

  function removeEquipment(item: string) {
    setEquipment(equipment.filter((e) => e !== item));
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{desk ? 'Edit Desk' : 'Add Desk'}</DialogTitle>
        </DialogHeader>
        <form action={action} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="label">Label</Label>
            <Input
              id="label"
              name="label"
              required
              defaultValue={desk?.label}
              placeholder="e.g., A-101"
            />
          </div>
          <div className="space-y-2">
            <Label>Zone</Label>
            <Select value={selectedZone} onValueChange={setSelectedZone}>
              <SelectTrigger>
                <SelectValue placeholder="Select zone" />
              </SelectTrigger>
              <SelectContent>
                {zones.map((z) => (
                  <SelectItem key={z.id} value={z.id}>
                    {z.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DESK_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DESK_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Equipment</Label>
            <div className="flex gap-2">
              <Input
                value={equipmentInput}
                onChange={(e) => setEquipmentInput(e.target.value)}
                placeholder="e.g., Monitor, Keyboard"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addEquipment();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={addEquipment}>
                Add
              </Button>
            </div>
            {equipment.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {equipment.map((item) => (
                  <Badge key={item} variant="secondary" className="gap-1">
                    {item}
                    <button type="button" onClick={() => removeEquipment(item)}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pos_x">Pos X</Label>
              <Input
                id="pos_x"
                name="pos_x"
                type="number"
                defaultValue={desk?.pos_x ?? 0}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pos_y">Pos Y</Label>
              <Input
                id="pos_y"
                name="pos_y"
                type="number"
                defaultValue={desk?.pos_y ?? 0}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rotation">Rotation</Label>
              <Input
                id="rotation"
                name="rotation"
                type="number"
                defaultValue={desk?.rotation ?? 0}
                min={0}
                max={360}
              />
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
                  {desk ? 'Updating...' : 'Creating...'}
                </>
              ) : desk ? (
                'Update Desk'
              ) : (
                'Add Desk'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
