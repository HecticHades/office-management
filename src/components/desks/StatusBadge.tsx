import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type StatusBadgeProps = {
  status: 'available' | 'maintenance' | 'reserved';
  className?: string;
};

const statusStyles = {
  available: 'bg-green-100 text-green-800 border-green-200',
  maintenance: 'bg-amber-100 text-amber-800 border-amber-200',
  reserved: 'bg-slate-100 text-slate-800 border-slate-200',
};

const statusLabels = {
  available: 'Available',
  maintenance: 'Maintenance',
  reserved: 'Reserved',
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <Badge variant="outline" className={cn(statusStyles[status], className)}>
      {statusLabels[status]}
    </Badge>
  );
}
