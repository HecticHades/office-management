'use client';

import React, { useState } from 'react';
import { ImageIcon, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { updateFloorPlanConfig } from '@/actions/floor-plan-config';
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

type FloorPlanImageUploadProps = {
  currentImageUrl: string | null;
  onSave: (imageUrl: string | null) => void;
  trigger: React.ReactNode;
};

function FloorPlanImageUpload({
  currentImageUrl,
  onSave,
  trigger,
}: FloorPlanImageUploadProps) {
  const [open, setOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState(currentImageUrl ?? '');
  const [previewError, setPreviewError] = useState(false);
  const [saving, setSaving] = useState(false);

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen) {
      setImageUrl(currentImageUrl ?? '');
      setPreviewError(false);
    }
  }

  function handleClear() {
    setImageUrl('');
    setPreviewError(false);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const urlToSave = imageUrl.trim() || null;
      const result = await updateFloorPlanConfig({ image_url: urlToSave });

      if (!result.success) {
        toast.error(result.error ?? 'Failed to update floor plan image');
        return;
      }

      toast.success('Floor plan image updated');
      onSave(urlToSave);
      setOpen(false);
    } catch {
      toast.error('An unexpected error occurred');
    } finally {
      setSaving(false);
    }
  }

  const hasUrl = imageUrl.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="rounded-xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-stone-800">
            <ImageIcon className="size-5 text-teal-600" />
            Floor Plan Background
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* URL input */}
          <div className="space-y-2">
            <Label htmlFor="floor-plan-url" className="text-stone-700">
              Image URL
            </Label>
            <div className="flex gap-2">
              <Input
                id="floor-plan-url"
                type="url"
                placeholder="https://example.com/floor-plan.png"
                value={imageUrl}
                onChange={(e) => {
                  setImageUrl(e.target.value);
                  setPreviewError(false);
                }}
              />
              {hasUrl && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleClear}
                  aria-label="Clear image URL"
                  className="shrink-0"
                >
                  <Trash2 className="size-4 text-stone-500" />
                </Button>
              )}
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label className="text-stone-700">Preview</Label>
            <div className="flex items-center justify-center rounded-xl border border-stone-200 bg-stone-50 p-2 min-h-[160px]">
              {hasUrl && !previewError ? (
                <img
                  src={imageUrl.trim()}
                  alt="Floor plan preview"
                  className="max-h-[240px] max-w-full rounded-lg object-contain"
                  onError={() => setPreviewError(true)}
                />
              ) : hasUrl && previewError ? (
                <div className="flex flex-col items-center gap-1 text-stone-400">
                  <ImageIcon className="size-8" />
                  <span className="text-sm">Could not load image</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1 text-stone-400">
                  <ImageIcon className="size-8" />
                  <span className="text-sm">No image set</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-teal-600 text-white hover:bg-teal-700"
          >
            {saving && <Loader2 className="size-4 animate-spin" />}
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { FloorPlanImageUpload };
export type { FloorPlanImageUploadProps };
