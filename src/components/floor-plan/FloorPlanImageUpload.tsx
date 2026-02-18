'use client';

import React, { useState, useRef } from 'react';
import { ImageIcon, Trash2, Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  floor: number;
  trigger: React.ReactNode;
};

function FloorPlanImageUpload({
  currentImageUrl,
  onSave,
  floor,
  trigger,
}: FloorPlanImageUploadProps) {
  const [open, setOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState(currentImageUrl ?? '');
  const [previewError, setPreviewError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  async function uploadFile(file: File) {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Use PNG, JPEG, WebP, or SVG.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large. Maximum 5 MB.');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload/floor-plan', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || 'Upload failed');
        return;
      }

      setImageUrl(result.url);
      setPreviewError(false);
      toast.success('Image uploaded');
    } catch {
      toast.error('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    // Reset so the same file can be re-selected
    e.target.value = '';
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const urlToSave = imageUrl.trim() || null;
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
            Floor {floor} Workspace Image
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="upload" className="flex-1 gap-1.5">
                <Upload className="size-3.5" />
                Upload
              </TabsTrigger>
              <TabsTrigger value="url" className="flex-1 gap-1.5">
                <ImageIcon className="size-3.5" />
                URL
              </TabsTrigger>
            </TabsList>

            {/* Upload tab */}
            <TabsContent value="upload" className="space-y-3 pt-2">
              <div
                className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-6 transition-colors cursor-pointer ${
                  dragOver
                    ? 'border-teal-500 bg-teal-50'
                    : 'border-stone-200 bg-stone-50 hover:border-stone-300'
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploading ? (
                  <>
                    <Loader2 className="size-8 animate-spin text-teal-600" />
                    <span className="text-sm text-stone-500">Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload className="size-8 text-stone-400" />
                    <div className="text-center">
                      <p className="text-sm font-medium text-stone-600">
                        Drop an image here or click to browse
                      </p>
                      <p className="text-xs text-stone-400 mt-1">
                        PNG, JPEG, WebP, or SVG up to 5 MB
                      </p>
                    </div>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            </TabsContent>

            {/* URL tab */}
            <TabsContent value="url" className="space-y-3 pt-2">
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
            </TabsContent>
          </Tabs>

          {/* Preview */}
          <div className="space-y-2">
            <Label className="text-stone-700">Preview</Label>
            <div className="flex items-center justify-center rounded-xl border border-stone-200 bg-stone-50 p-2 min-h-[160px] relative">
              {hasUrl && !previewError ? (
                <>
                  <img
                    src={imageUrl.trim()}
                    alt="Workspace preview"
                    className="max-h-[240px] max-w-full rounded-lg object-contain"
                    onError={() => setPreviewError(true)}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleClear}
                    className="absolute top-3 right-3 size-7 bg-white/80 backdrop-blur"
                    aria-label="Remove image"
                  >
                    <Trash2 className="size-3.5 text-stone-500" />
                  </Button>
                </>
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
            disabled={saving || uploading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || uploading}
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
