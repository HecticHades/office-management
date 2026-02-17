import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type StatusBadgeProps = {
  status: 'available' | 'maintenance' | 'reserved';
  className?: string;
};

const statusStyles = {
  available: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  maintenance: 'bg-amber-50 text-amber-700 border-amber-200',
  reserved: 'bg-stone-100 text-stone-600 border-stone-200',
};

const statusLabels = {
  available: 'Available',
  maintenance: 'Maintenance',
  reserved: 'Reserved',
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <Badge variant="outline" className={cn('rounded-full text-xs font-medium', statusStyles[status], className)}>
      {statusLabels[status]}
    </Badge>
  );
}
