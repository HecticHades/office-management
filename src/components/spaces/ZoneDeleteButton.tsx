'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteZone } from '@/actions/zones';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

type ZoneDeleteButtonProps = {
  zoneId: string;
  zoneName: string;
};

export function ZoneDeleteButton({ zoneId, zoneName }: ZoneDeleteButtonProps) {
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    setIsPending(true);
    const result = await deleteZone(zoneId);
    if (result.success) {
      toast.success('Zone deleted successfully');
      router.push('/spaces');
    } else {
      toast.error(result.error || 'Failed to delete zone');
      setIsPending(false);
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Zone</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete &quot;{zoneName}&quot;? This will also remove
            all desks and bookings in this zone. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete Zone'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
