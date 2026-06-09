import { BookingStatus } from '@/types';

const config: Record<
  BookingStatus,
  { label: string; dot: string; cls: string }
> = {
  [BookingStatus.PENDING]: {
    label: 'Pending',
    dot: 'bg-amber-400',
    cls: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/60',
  },
  [BookingStatus.ASSIGNED]: {
    label: 'Assigned',
    dot: 'bg-indigo-400',
    cls: 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200/60',
  },
  [BookingStatus.COLLECTED]: {
    label: 'Collected',
    dot: 'bg-emerald-400',
    cls: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60',
  },
  [BookingStatus.CANCELLED]: {
    label: 'Cancelled',
    dot: 'bg-slate-400',
    cls: 'bg-slate-100 text-slate-500 ring-1 ring-slate-200/60',
  },
};

export function StatusBadge({ status }: { status: BookingStatus }) {
  const { label, dot, cls } = config[status] ?? {
    label: status,
    dot: 'bg-slate-400',
    cls: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200/60',
  };
  return (
    <span className={`status-badge ${cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />
      {label}
    </span>
  );
}
