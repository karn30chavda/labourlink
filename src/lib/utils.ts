import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, formatDistanceToNow, differenceInDays, isValid, parseISO } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRelativeDate(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return 'N/A';

  let date: Date;
  if (typeof dateInput === 'string') {
    date = parseISO(dateInput);
  } else {
    date = dateInput;
  }

  if (!isValid(date)) {
    return 'Invalid Date';
  }

  const now = new Date();
  const daysDifference = differenceInDays(now, date);

  if (daysDifference < 0) { // Future date
    return `on ${format(date, 'PPP')}`;
  }
  if (daysDifference < 1 && date.getDate() === now.getDate()) { // Today
    return formatDistanceToNow(date, { addSuffix: true });
  }
  if (daysDifference < 7) { // Within the last week
    return formatDistanceToNow(date, { addSuffix: true });
  }
  return format(date, 'PPP'); // Older than a week
}

export function formatFullDate(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return 'N/A';
   let date: Date;
  if (typeof dateInput === 'string') {
    date = parseISO(dateInput);
  } else {
    date = dateInput;
  }
  if (!isValid(date)) return 'Invalid Date';
  return format(date, 'PPP p'); // e.g., Jul 24, 2024, 4:30 PM
}
