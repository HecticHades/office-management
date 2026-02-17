'use client';

import { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatusBadge } from './StatusBadge';
import { DeskForm } from './DeskForm';
import { usePermissions } from '@/lib/hooks/use-permissions';
import { ArrowUpDown, Edit, Trash2 } from 'lucide-react';
import { deleteDesk } from '@/actions/desks';
import { toast } from 'sonner';
import type { Desk, Zone, Booking } from '@/lib/db/types';

type DeskWithZone = Desk & {
  zone: Pick<Zone, 'id' | 'name'>;
  currentBooking?: Pick<Booking, 'id' | 'user_id' | 'time_slot'>;
};

type DeskTableProps = {
  desks: DeskWithZone[];
  zones: Pick<Zone, 'id' | 'name'>[];
};

const typeLabels: Record<string, string> = {
  standard: 'Standard',
  standing: 'Standing',
  private: 'Private',
  shared: 'Shared',
};

export function DeskTable({ desks, zones }: DeskTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [zoneFilter, setZoneFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const { isAdmin } = usePermissions();

  const filteredDesks = useMemo(() => {
    let result = desks;
    if (zoneFilter !== 'all') {
      result = result.filter((d) => d.zone_id === zoneFilter);
    }
    if (typeFilter !== 'all') {
      result = result.filter((d) => d.desk_type === typeFilter);
    }
    if (statusFilter !== 'all') {
      result = result.filter((d) => d.status === statusFilter);
    }
    return result;
  }, [desks, zoneFilter, typeFilter, statusFilter]);

  async function handleDelete(deskId: string) {
    if (!confirm('Are you sure you want to delete this desk?')) return;
    const result = await deleteDesk(deskId);
    if (result.success) {
      toast.success('Desk deleted');
    } else {
      toast.error(result.error || 'Failed to delete desk');
    }
  }

  const columns: ColumnDef<DeskWithZone>[] = [
    {
      accessorKey: 'label',
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting()}>
          Label <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <span className="font-medium">{row.original.label}</span>,
    },
    {
      accessorKey: 'zone.name',
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting()}>
          Zone <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => row.original.zone.name,
    },
    {
      accessorKey: 'desk_type',
      header: 'Type',
      cell: ({ row }) => (
        <Badge variant="outline">{typeLabels[row.original.desk_type]}</Badge>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'equipment',
      header: 'Equipment',
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1 max-w-[200px]">
          {row.original.equipment && row.original.equipment.length > 0 ? (
            row.original.equipment.map((item) => (
              <Badge key={item} variant="secondary" className="text-xs">
                {item}
              </Badge>
            ))
          ) : (
            <span className="text-muted-foreground text-sm">-</span>
          )}
        </div>
      ),
    },
    ...(isAdmin
      ? [
          {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }: { row: { original: DeskWithZone } }) => (
              <div className="flex items-center gap-1">
                <DeskForm
                  desk={row.original}
                  trigger={
                    <Button variant="ghost" size="icon">
                      <Edit className="h-4 w-4" />
                    </Button>
                  }
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(row.original.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ),
          } as ColumnDef<DeskWithZone>,
        ]
      : []),
  ];

  const table = useReactTable({
    data: filteredDesks,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: { sorting },
    onSortingChange: setSorting,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <Select value={zoneFilter} onValueChange={setZoneFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by zone" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Zones</SelectItem>
            {zones.map((z) => (
              <SelectItem key={z.id} value={z.id}>
                {z.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.entries(typeLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
            <SelectItem value="reserved">Reserved</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No desks found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
