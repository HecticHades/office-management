import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, formatDistanceToNow, parseISO } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

function toDate(date: Date | string): Date {
  return typeof date === 'string' ? parseISO(date) : date;
}

export function formatDate(date: Date | string): string {
  return format(toDate(date), 'MMM d, yyyy');
}

export function formatDateTime(date: Date | string): string {
  return format(toDate(date), 'MMM d, yyyy h:mm a');
}

export function formatRelative(date: Date | string): string {
  return formatDistanceToNow(toDate(date), { addSuffix: true });
}
